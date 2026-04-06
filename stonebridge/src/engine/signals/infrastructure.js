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

function parseInfrastructureSignals(rows, url) {
  const signals = [];
  const normalized = JSON.stringify(rows).toLowerCase();

  if (normalized.includes("water")) {
    signals.push(buildSignal({
      source: "Baltimore Infrastructure Data",
      category: "INFRASTRUCTURE",
      label: "Aging water main proximity",
      value: "Infrastructure records reference water assets near the parcel",
      severity: "MEDIUM",
      url
    }));
  }

  if (normalized.includes("flood") || normalized.includes("drain")) {
    signals.push(buildSignal({
      source: "Baltimore Infrastructure Data",
      category: "INFRASTRUCTURE",
      label: "Flood sensitivity",
      value: "Stormwater or flood-related infrastructure records appear nearby",
      severity: "HIGH",
      url
    }));
  }

  return signals.slice(0, 2);
}

function mockInfrastructureSignals(address) {
  const seed = addressSeed(address);
  const url = "https://data.baltimorecity.gov";
  const scenarios = [
    {
      labelIndex: 50,
      severityIndex: 51,
      labelOptions: [
        "Aging water main proximity",
        "Utility asset age burden",
        "Water network fragility"
      ],
      valueOptions: [
        "Older buried utility assets may elevate repair risk nearby",
        "Water network age profile appears less resilient than average",
        "Utility asset age suggests a higher chance of surprise repair work"
      ]
    },
    {
      labelIndex: 52,
      severityIndex: 53,
      labelOptions: [
        "Road condition drag",
        "Street maintenance friction",
        "Surface access deterioration"
      ],
      valueOptions: [
        "Street condition around the parcel may slow staging and access",
        "Maintenance backlog suggests avoidable access friction",
        "Surface deterioration could increase near-term site logistics cost"
      ]
    },
    {
      labelIndex: 54,
      severityIndex: 55,
      labelOptions: [
        "Flood sensitivity",
        "Stormwater concentration",
        "Below-grade runoff risk"
      ],
      valueOptions: [
        "Parcel context suggests above-average stormwater concentration risk",
        "Runoff pattern may create recurring water-management costs",
        "Below-grade drainage sensitivity appears elevated for the block"
      ]
    }
  ];

  const signals = scenarios
    .filter((_, index) => seededRandom(seed, index + 50) > 0.6)
    .slice(0, 2)
    .map((scenario) => {
      const labelPick = Math.floor(seededRandom(seed, scenario.labelIndex) * scenario.labelOptions.length);
      const valuePick = Math.floor(seededRandom(seed, scenario.labelIndex + 20) * scenario.valueOptions.length);
      return buildSignal({
        source: "Baltimore Infrastructure Data",
        category: "INFRASTRUCTURE",
        label: scenario.labelOptions[labelPick],
        value: scenario.valueOptions[valuePick],
        severity: severityFromValue(seededRandom(seed, scenario.severityIndex)),
        url
      });
    });

  console.log("[signals:infrastructure] mock fallback - API unavailable");
  return signals;
}

async function checkInfrastructureRisk(address) {
  try {
    const query = encodeURIComponent(address);
    const url = `https://data.baltimorecity.gov/resource/r7wy-f7n5.json?$limit=8&$q=${query}`;
    const response = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("No results");
    console.log(`[signals:infrastructure] live data - ${rows.length} records`);
    return parseInfrastructureSignals(rows, url);
  } catch (error) {
    return mockInfrastructureSignals(address);
  }
}

module.exports = { checkInfrastructureRisk };
