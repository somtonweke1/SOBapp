const { checkPropertyRecords } = require("./signals/property");
const { checkLiens } = require("./signals/liens");
const { checkUtilityAnomalies } = require("./signals/utility");
const { checkProcurementAdjacency } = require("./signals/procurement");
const { checkOwnershipContext } = require("./signals/ownership");
const { checkInfrastructureRisk } = require("./signals/infrastructure");

function computeRiskScore(signals) {
  const weights = { CRITICAL: 20, HIGH: 10, MEDIUM: 5, LOW: 1 };
  const raw = signals.reduce((sum, signal) => sum + (weights[signal.severity] || 0), 0);
  return Math.min(100, raw);
}

function deriveVerdict(score) {
  if (score >= 65) return "ESCALATE";
  if (score >= 35) return "CAUTION";
  return "PROCEED";
}

async function diagnose(address) {
  const results = await Promise.allSettled([
    checkPropertyRecords(address),
    checkLiens(address),
    checkUtilityAnomalies(address),
    checkProcurementAdjacency(address),
    checkOwnershipContext(address),
    checkInfrastructureRisk(address)
  ]);

  const signals = results
    .filter(result => result.status === "fulfilled")
    .flatMap(result => result.value)
    .reduce((accumulator, signal) => {
      const count = accumulator.categoryCounts.get(signal.category) || 0;
      if (count < 2) {
        accumulator.signals.push(signal);
        accumulator.categoryCounts.set(signal.category, count + 1);
      }
      return accumulator;
    }, { signals: [], categoryCounts: new Map() })
    .signals
    .sort((a, b) => {
      const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return order[b.severity] - order[a.severity];
    });

  const riskScore = computeRiskScore(signals);
  const flagCount = signals.filter(signal => signal.severity !== "LOW").length;
  const verdict = deriveVerdict(riskScore);

  return { signals, riskScore, flagCount, verdict };
}

module.exports = { diagnose, computeRiskScore, deriveVerdict };
