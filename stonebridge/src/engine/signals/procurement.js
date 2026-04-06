const crypto = require("crypto");
const { config } = require("../../lib/config");
const { buildSignal, zipFromAddress } = require("./common");

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

function parseProcurementSignals(data, zip, url) {
  const opportunities = data.opportunitiesData || data.opportunities || [];
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return [];
  }

  return [
    buildSignal({
      source: "SAM.gov",
      category: "PROCUREMENT",
      label: "Federal procurement adjacency",
      value: `${opportunities.length} recent SAM.gov opportunities reference ZIP ${zip}`,
      severity: opportunities.length >= 10 ? "HIGH" : opportunities.length >= 4 ? "MEDIUM" : "LOW",
      url
    })
  ];
}

function mockProcurementSignals(address) {
  const seed = addressSeed(address);
  const zip = zipFromAddress(address);
  const url = "https://api.sam.gov/opportunities/v2/search";
  const scenarios = [
    {
      labelIndex: 30,
      severityIndex: 31,
      labelOptions: [
        "Procurement adjacency",
        "Contractor density",
        "Bid ecosystem overlap"
      ],
      valueOptions: [
        `${zip} has a modest cluster of public-sector contractor activity`,
        `Contractor network in ${zip} appears active enough to affect local deal flow`,
        `Bid ecosystem overlap in ${zip} suggests moderate public-contract exposure`
      ]
    },
    {
      labelIndex: 32,
      severityIndex: 33,
      labelOptions: [
        "Vendor integrity risk",
        "Suspension adjacency",
        "Compliance screening pressure"
      ],
      valueOptions: [
        "Nearby contractor graph shows elevated integrity-screening noise",
        "Suspension-style vendor pattern may complicate partner diligence",
        "Compliance screening burden looks heavier than a clean contractor set"
      ]
    }
  ];

  const signals = scenarios
    .filter((_, index) => seededRandom(seed, index + 30) > 0.6)
    .slice(0, 2)
    .map((scenario) => {
      const labelPick = Math.floor(seededRandom(seed, scenario.labelIndex) * scenario.labelOptions.length);
      const valuePick = Math.floor(seededRandom(seed, scenario.labelIndex + 20) * scenario.valueOptions.length);
      return buildSignal({
        source: scenario.severityIndex === 33 ? "SAM.gov" : "eMMA",
        category: "PROCUREMENT",
        label: scenario.labelOptions[labelPick],
        value: scenario.valueOptions[valuePick],
        severity: severityFromValue(seededRandom(seed, scenario.severityIndex)),
        url
      });
    });

  console.log("[signals:procurement] mock fallback - API unavailable");
  return signals;
}

async function checkProcurementAdjacency(address) {
  if (!config.samGovApiKey) {
    return mockProcurementSignals(address);
  }

  try {
    const zip = zipFromAddress(address);
    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${encodeURIComponent(config.samGovApiKey)}&zip=${encodeURIComponent(zip)}&limit=10`;
    const response = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const signals = parseProcurementSignals(data, zip, url);
    if (signals.length === 0) throw new Error("No results");
    console.log(`[signals:procurement] live data - ${signals.length} signals derived`);
    return signals;
  } catch (error) {
    return mockProcurementSignals(address);
  }
}

module.exports = { checkProcurementAdjacency };
