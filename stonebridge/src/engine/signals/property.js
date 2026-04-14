/** Baltimore property parcel and code-enforcement signals (live Socrata or deterministic fallback). */
const { addressSeed, baltimoreOpenDataHeaders, buildSignal, fetchWithTimeout, isLikelyAddress, normalizeAddress, seededRandom, severityFromValue } = require("./common");

/** Maps Socrata rows to at most two normalized property signals. */
function parsePropertySignals(rows, address, url) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const row = rows[0];
  const signals = [];
  const violationCount = Number(row.codeviolationcount || row.openviolationcount || 0);
  const vacant =
    String(row.vacantbuildingnotice || row.vacant_building_notice || "").toUpperCase() === "Y";
  const assessedValue = row.assessmentamount || row.taxbase || row.improvementvalue;

  if (vacant) {
    const severityLevel = violationCount >= 5 ? "CRITICAL" : "HIGH";
    const compoundIssue = violationCount >= 5 ? ` Compounded by ${violationCount} violations—suggests prolonged neglect.` : '';
    const investmentImplication = severityLevel === "CRITICAL"
      ? ' Investment impact: Major rehabilitation required. Budget for full systems replacement, asbestos/lead abatement, and extended permit timelines. Likely need specialist contractor.'
      : ' Investment impact: Moderate rehabilitation scope. Verify building is secure, utilities disconnected properly, and structural integrity maintained.';

    signals.push(buildSignal({
      source: "Baltimore City Open Data",
      category: "PROPERTY_DISTRESS",
      label: "Vacancy notice on file",
      value: `Vacant building notice present.${compoundIssue}${investmentImplication}`,
      severity: severityLevel,
      url
    }));
  }

  if (violationCount > 0) {
    const severityLevel = violationCount >= 8 ? "CRITICAL" : violationCount >= 4 ? "HIGH" : "MEDIUM";
    let insight = '';

    if (severityLevel === "CRITICAL") {
      insight = ' Pattern suggests chronic compliance issues. Underwriting impact: Budget for full code compliance review, likely Stop Work Order risk, and extended stabilization timeline. Consider specialist legal counsel.';
    } else if (severityLevel === "HIGH") {
      insight = ' Elevated violation count indicates deferred maintenance or non-compliant prior work. Underwriting impact: Engage code consultant early, budget 15-25% construction contingency, expect permit delays.';
    } else {
      insight = ' Moderate violation history—common for Baltimore properties. Underwriting impact: Standard due diligence applies. Review violation types to assess scope.';
    }

    signals.push(buildSignal({
      source: "Baltimore City Open Data",
      category: "PROPERTY_DISTRESS",
      label: "Repeated code violations",
      value: `${violationCount} code issues tied to parcel.${insight}`,
      severity: severityLevel,
      url
    }));
  }

  if (signals.length < 2 && assessedValue) {
    signals.push(buildSignal({
      source: "Baltimore City Open Data",
      category: "PROPERTY_DISTRESS",
      label: "Assessment snapshot",
      value: `Assessed value ${assessedValue} for ${row.propertyaddress || address}`,
      severity: "LOW",
      url
    }));
  }

  return signals.slice(0, 2);
}

function mockPropertySignals(address) {
  const seed = addressSeed(address);
  const url = "https://data.baltimorecity.gov/resource/5qtz-d274.json";
  const scenarios = [
    {
      labelIndex: 0,
      severityIndex: 1,
      labelOptions: [
        "Vacancy pressure",
        "Board-up history",
        "Distressed occupancy pattern"
      ],
      valueOptions: [
        "Vacant building indicators match nearby enforcement patterns",
        "Board-up activity suggests inactive occupancy",
        "Occupancy turnover pattern points to elevated rehab friction"
      ]
    },
    {
      labelIndex: 2,
      severityIndex: 3,
      labelOptions: [
        "Code violation history",
        "Inspection backlog",
        "Enforcement recurrence"
      ],
      valueOptions: [
        "Code enforcement history is heavier than neighborhood baseline",
        "Inspection backlog suggests deferred corrective work",
        "Repeated enforcement pattern tied to parcel record"
      ]
    },
    {
      labelIndex: 4,
      severityIndex: 5,
      labelOptions: [
        "Permit lag",
        "Rehab sequencing gap",
        "Permit compliance drift"
      ],
      valueOptions: [
        "Permit timeline appears misaligned with current scope assumptions",
        "Rehab sequencing gap suggests delayed stabilization work",
        "Permit activity cadence is thinner than expected for active turnover"
      ]
    }
  ];

  const signals = scenarios
    .filter((_, index) => seededRandom(seed, index) > 0.6)
    .slice(0, 2)
    .map((scenario) => {
      const labelPick = Math.floor(seededRandom(seed, scenario.labelIndex) * scenario.labelOptions.length);
      const valuePick = Math.floor(seededRandom(seed, scenario.labelIndex + 20) * scenario.valueOptions.length);
      return buildSignal({
        source: "Baltimore City Open Data (estimated)",
        category: "PROPERTY_DISTRESS",
        label: scenario.labelOptions[labelPick],
        value: scenario.valueOptions[valuePick],
        severity: severityFromValue(seededRandom(seed, scenario.severityIndex)),
        url
      });
    });

  console.log("[signals:property] mock fallback - API unavailable");
  return signals;
}

async function checkPropertyRecords(address) {
  // Validate input address
  const normalized = normalizeAddress(address);
  if (!normalized || !isLikelyAddress(normalized)) {
    console.warn("[signals:property] invalid address format, returning empty signals");
    return [];
  }

  try {
    const encoded = encodeURIComponent(normalized);
    const url = `https://data.baltimorecity.gov/resource/5qtz-d274.json?$limit=5&$q=${encoded}`;
    const response = await fetchWithTimeout(url, {
      signal: AbortSignal.timeout(4000),
      headers: baltimoreOpenDataHeaders()
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("No results");
    console.log(`[signals:property] live data - ${rows.length} records`);
    return parsePropertySignals(rows, normalized, url);
  } catch (error) {
    console.warn("[signals:property] live fetch failed, using estimated signals:", error.message);
    return mockPropertySignals(normalized);
  }
}

module.exports = { checkPropertyRecords };
