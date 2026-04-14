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

/** Generates executive summary with investment thesis and key actions */
function generateExecutiveSummary(signals, riskScore, verdict, patterns, coordinates) {
  const summary = {
    investmentThesis: '',
    keyRisks: [],
    keyOpportunities: [],
    criticalActions: [],
    timeline: '',
    confidence: 'medium'
  };

  const criticalCount = signals.filter(s => s.severity === 'CRITICAL').length;
  const highCount = signals.filter(s => s.severity === 'HIGH').length;
  const spatialSignals = signals.filter(s => s.category === 'GIS_SPATIAL');
  const propertySignals = signals.filter(s => s.category === 'PROPERTY_DISTRESS');
  const ownershipSignals = signals.filter(s => s.category === 'OWNERSHIP' || s.category === 'LIEN' || s.category === 'TITLE');

  // Investment Thesis
  if (verdict === 'ESCALATE') {
    if (patterns.some(p => p.type === 'CASCADING_DISTRESS')) {
      summary.investmentThesis = 'High-risk turnaround opportunity requiring specialized expertise and deep capital reserves. Suitable only for experienced distressed asset operators with 18-24 month stabilization timeline.';
      summary.timeline = '18-24 months to stabilization';
    } else if (spatialSignals.some(s => s.severity === 'HIGH' || s.severity === 'CRITICAL')) {
      summary.investmentThesis = 'Property may be investable but neighborhood context carries material risk. Requires basis discount of 20-30% vs. cleaner comps and shorter hold period strategy.';
      summary.timeline = '12-18 months to exit';
    } else {
      summary.investmentThesis = 'Property-specific issues dominate risk profile. Addressable with proper due diligence and construction/legal budget, but not for novice investors.';
      summary.timeline = '12-15 months to stabilization';
    }
  } else if (verdict === 'CAUTION') {
    const hasImprovingTrend = spatialSignals.some(s => s.value.includes('Improving') || s.value.includes('stabilizing'));
    if (hasImprovingTrend) {
      summary.investmentThesis = 'Mixed signals with potential upside. Block may be turning—opportunity for patient capital if basis is right. Requires active asset management and market timing.';
      summary.timeline = '9-12 months to value-add stabilization';
    } else {
      summary.investmentThesis = 'Moderate risk profile. Standard Baltimore urban investment with manageable friction points. Suitable for experienced operators with Baltimore market knowledge.';
      summary.timeline = '6-9 months to stabilization';
    }
  } else {
    summary.investmentThesis = 'Lower-risk profile relative to Baltimore baseline. Spatial and document screens align positively. Suitable for standard underwriting with typical contingencies.';
    summary.timeline = '4-6 months to stabilization';
  }

  // Key Risks
  if (criticalCount > 0) {
    summary.keyRisks.push(`${criticalCount} CRITICAL issue${criticalCount > 1 ? 's' : ''} require immediate attention before proceeding`);
  }
  if (patterns.some(p => p.severity === 'CRITICAL' || p.severity === 'HIGH')) {
    patterns.filter(p => p.severity === 'CRITICAL' || p.severity === 'HIGH').forEach(p => {
      summary.keyRisks.push(p.description);
    });
  }
  if (spatialSignals.some(s => s.value.includes('accelerating'))) {
    summary.keyRisks.push('Neighborhood conditions deteriorating—trend is against you');
  }
  if (propertySignals.some(s => s.severity === 'CRITICAL')) {
    summary.keyRisks.push('Severe property distress—major rehabilitation required');
  }

  // Key Opportunities
  if (spatialSignals.some(s => s.value.includes('Improving') || s.value.includes('stabilizing'))) {
    summary.keyOpportunities.push('Neighborhood showing signs of stabilization—timing may favor entry');
  }
  if (verdict === 'PROCEED' && patterns.length === 0) {
    summary.keyOpportunities.push('Clean risk profile—opportunity for streamlined acquisition');
  }
  if (patterns.some(p => p.type === 'CLEAN_PROPERTY_RISKY_NEIGHBORHOOD')) {
    summary.keyOpportunities.push('Property is cleaner than neighborhood suggests—potential for outperformance if block turns');
  }
  if (ownershipSignals.some(s => s.value.includes('distressed') || s.value.includes('thinly capitalized'))) {
    summary.keyOpportunities.push('Potential distressed seller—negotiate hard on basis');
  }

  // Critical Actions
  patterns.forEach(p => {
    if (p.recommendation) {
      summary.criticalActions.push(p.recommendation);
    }
  });

  if (spatialSignals.some(s => s.value.includes('Site visit required'))) {
    summary.criticalActions.push('MANDATORY: Physical site visit to walk block and photograph conditions');
  }
  if (propertySignals.some(s => s.severity === 'CRITICAL' || s.severity === 'HIGH')) {
    summary.criticalActions.push('Engage Baltimore code compliance consultant before LOI');
  }
  if (ownershipSignals.length >= 2) {
    summary.criticalActions.push('Order title search immediately—budget extra time for clearing');
  }

  // Confidence
  if (coordinates && coordinates.confidence === 'High' && signals.filter(s => !s.source.includes('estimated')).length > signals.length * 0.7) {
    summary.confidence = 'high';
  } else if (!coordinates || signals.filter(s => s.source.includes('estimated')).length > signals.length * 0.5) {
    summary.confidence = 'low';
  }

  return summary;
}

/** Analyzes patterns across multiple signal categories to identify correlated risks */
function detectSignalPatterns(signals) {
  const patterns = [];
  const categoryCounts = {};
  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  signals.forEach((signal) => {
    categoryCounts[signal.category] = (categoryCounts[signal.category] || 0) + 1;
    severityCounts[signal.severity] = (severityCounts[signal.severity] || 0) + 1;
  });

  const hasDistress = categoryCounts.PROPERTY_DISTRESS >= 1;
  const hasOwnership = categoryCounts.OWNERSHIP >= 1;
  const hasLiens = categoryCounts.LIEN >= 1 || categoryCounts.TITLE >= 1;
  const hasSpatial = categoryCounts.GIS_SPATIAL >= 1;
  const hasUtility = categoryCounts.UTILITY >= 1;
  const highSeverity = severityCounts.CRITICAL + severityCounts.HIGH;

  // Pattern: Distressed Owner + Property Issues
  if (hasOwnership && hasDistress && highSeverity >= 2) {
    patterns.push({
      type: 'DISTRESSED_OWNER_PROPERTY',
      severity: 'HIGH',
      description: 'Ownership stress correlating with property distress—suggests undercapitalized sponsor unable to maintain asset.',
      recommendation: 'Verify sponsor liquidity and asset management capacity. Consider acquisition opportunity if distressed sale.'
    });
  }

  // Pattern: Clean Property + Deteriorating Neighborhood
  if (!hasDistress && hasSpatial && signals.some(s => s.category === 'GIS_SPATIAL' && (s.severity === 'HIGH' || s.severity === 'CRITICAL'))) {
    patterns.push({
      type: 'CLEAN_PROPERTY_RISKY_NEIGHBORHOOD',
      severity: 'MEDIUM',
      description: 'Property appears clean but neighborhood context carries risk—watch for spillover effects.',
      recommendation: 'Price in neighborhood decline risk. Consider shorter hold period or value-add exit that doesn\'t depend on neighborhood recovery.'
    });
  }

  // Pattern: Utility Issues + Property Distress
  if (hasUtility && hasDistress) {
    patterns.push({
      type: 'INFRASTRUCTURE_PROPERTY_COMPOUND',
      severity: 'MEDIUM',
      description: 'Utility issues compounding with property distress—suggests deferred maintenance or systems failure.',
      recommendation: 'Budget for comprehensive systems inspection. Likely need full MEP (mechanical/electrical/plumbing) assessment.'
    });
  }

  // Pattern: Multiple Title/Lien Issues
  if ((categoryCounts.LIEN || 0) + (categoryCounts.TITLE || 0) >= 2) {
    patterns.push({
      type: 'TITLE_COMPLEXITY',
      severity: 'HIGH',
      description: 'Multiple title/lien signals suggest complex ownership or financial encumbrances.',
      recommendation: 'Engage title company early. Budget extra time and legal fees for title clearing. Consider title insurance cost.'
    });
  }

  // Pattern: Cascading Distress (3+ categories flagged)
  const flaggedCategories = Object.keys(categoryCounts).filter(cat => categoryCounts[cat] > 0);
  if (flaggedCategories.length >= 4 && highSeverity >= 3) {
    patterns.push({
      type: 'CASCADING_DISTRESS',
      severity: 'CRITICAL',
      description: 'Multiple risk categories flagged simultaneously—suggests systemic stress at property or sponsor level.',
      recommendation: 'Deep due diligence required. Consider pass/no-bid unless prepared for heavy lift turnaround with significant basis discount.'
    });
  }

  return patterns;
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
      spatialSignals = await checkSpatialRisk(address, geocodeResult.latitude, geocodeResult.longitude, {
        geocodeSource: geocodeResult.source,
        geocodeConfidence: geocodeResult.confidence,
        documentRiskScore: null
      });
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

  // Detect cross-signal patterns
  const patterns = detectSignalPatterns(signals);

  // Generate executive summary with investment intelligence
  const executiveSummary = generateExecutiveSummary(
    signals,
    riskScore,
    verdict,
    patterns,
    geocodeResult ? {
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      formattedAddress: geocodeResult.formattedAddress,
      source: geocodeResult.source || null,
      confidence: geocodeResult.confidence || null,
      coverage: geocodeResult.coverage || null
    } : null
  );

  return {
    signals,
    riskScore,
    flagCount,
    verdict,
    patterns, // New: cross-signal pattern detection
    executiveSummary, // New: investment thesis and actionable guidance
    coordinates: geocodeResult ? {
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      formattedAddress: geocodeResult.formattedAddress,
      source: geocodeResult.source || null,
      confidence: geocodeResult.confidence || null,
      coverage: geocodeResult.coverage || null
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
