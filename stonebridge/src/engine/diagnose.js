const { checkPropertyRecords } = require("./signals/property");
const { checkLiens } = require("./signals/liens");
const { checkUtilityAnomalies } = require("./signals/utility");
const { checkProcurementAdjacency } = require("./signals/procurement");
const { checkOwnershipContext } = require("./signals/ownership");
const { checkInfrastructureRisk } = require("./signals/infrastructure");

const SOURCE_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const CATEGORY_WEIGHTS = { CRITICAL: 24, HIGH: 12, MEDIUM: 6, LOW: 2 };

/** Computes a capped risk score from the highest-severity signal mix. */
function computeRiskScore(signals) {
  const grouped = signals.reduce((map, signal) => {
    const bucket = map.get(signal.category) || [];
    bucket.push(signal);
    map.set(signal.category, bucket);
    return map;
  }, new Map());

  const raw = [...grouped.values()].reduce((sum, bucket) => {
    const sorted = bucket
      .map((signal) => CATEGORY_WEIGHTS[signal.severity] || 0)
      .sort((left, right) => right - left);

    if (sorted.length === 0) return sum;
    const primary = sorted[0];
    const secondary = Math.round((sorted[1] || 0) * 0.5);
    return sum + primary + secondary;
  }, 0);

  return Math.max(0, Math.min(100, raw));
}

/** Maps a normalized risk score into the platform verdict bands. */
function deriveVerdict(score) {
  if (score >= 60) return "ESCALATE";
  if (score >= 28) return "CAUTION";
  return "PROCEED";
}

/** Deduplicates and caps signals so one source cannot overwhelm the result. */
function normalizeSignals(results) {
  return results
    .flatMap((result) => result.value)
    .reduce((accumulator, signal) => {
      const count = accumulator.categoryCounts.get(signal.category) || 0;
      const dedupeKey = `${signal.source}|${signal.category}|${signal.label}`;
      if (count < 2 && !accumulator.seen.has(dedupeKey)) {
        accumulator.signals.push(signal);
        accumulator.categoryCounts.set(signal.category, count + 1);
        accumulator.seen.add(dedupeKey);
      }
      return accumulator;
    }, { signals: [], categoryCounts: new Map(), seen: new Set() })
    .signals
    .sort((left, right) => SOURCE_ORDER[right.severity] - SOURCE_ORDER[left.severity]);
}

/** Runs all existing signal checks and returns a normalized deal diagnosis. */
async function diagnose(address) {
  const results = await Promise.allSettled([
    checkPropertyRecords(address),
    checkLiens(address),
    checkUtilityAnomalies(address),
    checkProcurementAdjacency(address),
    checkOwnershipContext(address),
    checkInfrastructureRisk(address)
  ]);

  const successfulResults = results.filter((result) => result.status === "fulfilled");
  const failedSources = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || "Signal source failed");

  const signals = normalizeSignals(successfulResults);

  const riskScore = computeRiskScore(signals);
  const flagCount = signals.filter(signal => signal.severity !== "LOW").length;
  const verdict = deriveVerdict(riskScore);

  return {
    signals,
    riskScore,
    flagCount,
    verdict,
    sourceStatus: {
      attempted: results.length,
      succeeded: successfulResults.length,
      failed: failedSources.length,
      failedSources
    }
  };
}

module.exports = { diagnose, computeRiskScore, deriveVerdict };
