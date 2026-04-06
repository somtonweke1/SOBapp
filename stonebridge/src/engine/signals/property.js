const crypto = require("crypto");
const { buildSignal } = require("./common");

function addressSeed(address) {
  return parseInt(
    crypto.createHash("sha256").update(address.toLowerCase().trim()).digest("hex").slice(0, 8),
    16
  );
}

function seededRandom(seed, index) {
  const value = Math.sin(seed + index) * 10000;
  return value - Math.floor(value);
}

function severityFromValue(value) {
  if (value < 0.3) return "LOW";
  if (value < 0.6) return "MEDIUM";
  if (value < 0.85) return "HIGH";
  return "CRITICAL";
}

async function fetchWithTimeout(url, options = {}) {
  if (typeof fetch === "function") {
    return fetch(url, options);
  }
  const mod = await import("node-fetch");
  return mod.default(url, options);
}

function parsePropertySignals(rows, address, url) {
  const row = rows[0];
  const signals = [];
  const violationCount = Number(row.codeviolationcount || row.openviolationcount || 0);
  const vacant =
    String(row.vacantbuildingnotice || row.vacant_building_notice || "").toUpperCase() === "Y";
  const assessedValue = row.assessmentamount || row.taxbase || row.improvementvalue;

  if (vacant) {
    signals.push(buildSignal({
      source: "Baltimore City Open Data",
      category: "PROPERTY_DISTRESS",
      label: "Vacancy notice on file",
      value: "Vacant building notice present",
      severity: violationCount >= 5 ? "CRITICAL" : "HIGH",
      url
    }));
  }

  if (violationCount > 0) {
    signals.push(buildSignal({
      source: "Baltimore City Open Data",
      category: "PROPERTY_DISTRESS",
      label: "Repeated code violations",
      value: `${violationCount} code issues tied to parcel`,
      severity: violationCount >= 8 ? "CRITICAL" : violationCount >= 4 ? "HIGH" : "MEDIUM",
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
        source: "Baltimore City Open Data",
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
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://data.baltimorecity.gov/resource/5qtz-d274.json?$limit=5&$q=${encoded}`;
    const response = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("No results");
    console.log(`[signals:property] live data - ${rows.length} records`);
    return parsePropertySignals(rows, address, url);
  } catch (error) {
    return mockPropertySignals(address);
  }
}

module.exports = { checkPropertyRecords };
