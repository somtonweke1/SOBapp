/**
 * Orchestrates parallel signal checks for one address, validates rows, computes risk, and derives a verdict.
 */
const { checkPropertyRecords } = require("./signals/property");
const { checkLiens } = require("./signals/liens");
const { checkUtilityAnomalies } = require("./signals/utility");
const { checkProcurementAdjacency } = require("./signals/procurement");
const { checkOwnershipContext } = require("./signals/ownership");
const { checkInfrastructureRisk } = require("./signals/infrastructure");
const { checkSpatialRisk } = require("./signals/spatial");
const { geocodeAddress } = require("../services/geocode");

/** Severity ordering used when sorting signals for presentation. */
const SOURCE_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

/** Per-signal weights; summed per category using top signal plus half the second (see computeRiskScore). */
const CATEGORY_WEIGHTS = { CRITICAL: 24, HIGH: 12, MEDIUM: 6, LOW: 2 };

/** Verdict band: score at/above this is ESCALATE (aligned with deriveVerdict). */
const VERDICT_ESCALATE_MIN = 60;

/** Verdict band: score at/above this (below ESCALATE) is CAUTION. */
const VERDICT_CAUTION_MIN = 28;

const VALID_SEVERITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const VALID_CATEGORIES = new Set([
  "UTILITY",
  "LIEN",
  "TITLE",
  "PROCUREMENT",
  "OWNERSHIP",
  "PROPERTY_DISTRESS",
  "INFRASTRUCTURE",
  "GIS_SPATIAL"
]);

const MAX_SOURCE_LEN = 240;
const MAX_LABEL_LEN = 500;
const MAX_VALUE_LEN = 4000;

/** Returns true when a signal row was synthesized because the live source was unavailable. */
function isEstimatedSignal(signal) {
  return String(signal?.source || "").includes("(estimated)");
}

/** Truncates strings and drops malformed rows so Prisma never receives invalid enums or oversized text. */
function validateAndNormalizeSignal(raw, index) {
  if (!raw || typeof raw !== "object") {
    console.warn(`[diagnose] skipping non-object signal at index ${index}`);
    return null;
  }
  const category = String(raw.category || "").trim();
  const severity = String(raw.severity || "").trim();
  if (!VALID_CATEGORIES.has(category) || !VALID_SEVERITIES.has(severity)) {
    console.warn(`[diagnose] skipping signal with invalid category/severity at index ${index}`, { category, severity });
    return null;
  }
  const source = String(raw.source || "Unknown").trim().slice(0, MAX_SOURCE_LEN);
  const label = String(raw.label || "").trim().slice(0, MAX_LABEL_LEN);
  const value = String(raw.value ?? raw.label ?? "").trim().slice(0, MAX_VALUE_LEN);
  if (!label) {
    console.warn(`[diagnose] skipping empty-label signal at index ${index}`);
    return null;
  }
  const url = raw.url == null || raw.url === "" ? null : String(raw.url).trim().slice(0, 2000);
  return { source, category, label, value, severity, url };
}

/** Human-readable risk band labels; thresholds match deriveVerdict (60 / 28). */
function riskBandLabel(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return "Unknown risk band";
  if (s >= VERDICT_ESCALATE_MIN) return "High risk band";
  if (s >= VERDICT_CAUTION_MIN) return "Moderate risk band";
  return "Lower risk band";
}

/** Computes a capped 0–100 risk score from the highest-severity signals per category. */
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

/** Maps risk score to Proceed / Caution / Escalate using fixed internal cutoffs. */
function deriveVerdict(score) {
  if (score >= VERDICT_ESCALATE_MIN) return "ESCALATE";
  if (score >= VERDICT_CAUTION_MIN) return "CAUTION";
  return "PROCEED";
}

/** Dedupes by source+category+label and keeps at most two signals per category. */
function normalizeSignals(results) {
  const flat = results.flatMap((result, batchIndex) => {
    if (result.status !== "fulfilled") return [];
    const value = result.value;
    const list = Array.isArray(value) ? value : [];
    return list.map((item, i) => validateAndNormalizeSignal(item, `${batchIndex}:${i}`)).filter(Boolean);
  });

  return flat
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

/** Runs all signal checks and returns scores, signals, and explicit source health metadata. */
async function diagnose(address) {
  // Run signal checks and geocoding in parallel
  const [signalResults, geocodeResult] = await Promise.all([
    Promise.allSettled([
      checkPropertyRecords(address),
      checkLiens(address),
      checkUtilityAnomalies(address),
      checkProcurementAdjacency(address),
      checkOwnershipContext(address),
      checkInfrastructureRisk(address)
    ]),
    geocodeAddress(address)
  ]);

  // Run spatial analysis if coordinates are available
  let spatialSignals = [];
  if (geocodeResult && geocodeResult.latitude && geocodeResult.longitude) {
    try {
      spatialSignals = await checkSpatialRisk(address, geocodeResult.latitude, geocodeResult.longitude);
    } catch (error) {
      console.error("[diagnose] Spatial risk check failed:", error.message);
    }
  }

  // Combine traditional signals with spatial signals
  const results = signalResults;
  const successfulResults = results.filter((result) => result.status === "fulfilled");

  // Add spatial signals as a fulfilled promise result
  if (spatialSignals.length > 0) {
    successfulResults.push({ status: "fulfilled", value: spatialSignals });
  }
  const failedSources = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || "Signal source failed");

  const signals = normalizeSignals(successfulResults);
  const estimatedSignalCount = signals.filter(isEstimatedSignal).length;
  const liveSignalCount = signals.length - estimatedSignalCount;

  let riskScore = computeRiskScore(signals);
  /** When every signal is estimated, do not allow ESCALATE — synthetic data must not imply maximum operational urgency. */
  let scoreCappedForEstimatedOnly = false;
  if (signals.length > 0 && liveSignalCount === 0) {
    const capped = Math.min(riskScore, VERDICT_ESCALATE_MIN - 1);
    if (capped !== riskScore) scoreCappedForEstimatedOnly = true;
    riskScore = capped;
  }

  const flagCount = signals.filter((signal) => signal.severity !== "LOW").length;
  const verdict = deriveVerdict(riskScore);

  return {
    signals,
    riskScore,
    flagCount,
    verdict,
    coordinates: geocodeResult ? {
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      formattedAddress: geocodeResult.formattedAddress
    } : null,
    dataQuality: {
      estimatedSignalCount,
      liveSignalCount,
      scoreCappedForEstimatedOnly,
      geocoded: geocodeResult !== null
    },
    sourceStatus: {
      attempted: results.length,
      fulfilled: successfulResults.length,
      rejected: failedSources.length,
      rejectedReasons: failedSources,
      estimatedSignalCount,
      liveSignalCount,
      /** @deprecated Use rejected / estimatedSignalCount; kept for older clients. */
      succeeded: successfulResults.length,
      failed: failedSources.length,
      failedSources
    }
  };
}

module.exports = {
  diagnose,
  computeRiskScore,
  deriveVerdict,
  riskBandLabel,
  VERDICT_ESCALATE_MIN,
  VERDICT_CAUTION_MIN
};
