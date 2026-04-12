/** City infrastructure exposure signals (Socrata or deterministic fallback). */
const { addressSeed, baltimoreOpenDataHeaders, buildSignal, fetchWithTimeout, isLikelyAddress, normalizeAddress, seededRandom, severityFromValue } = require("./common");

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
        source: "Baltimore Infrastructure Data (estimated)",
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
  // Validate input address
  const normalized = normalizeAddress(address);
  if (!normalized || !isLikelyAddress(normalized)) {
    console.warn("[signals:infrastructure] invalid address format, returning empty signals");
    return [];
  }

  try {
    const query = encodeURIComponent(normalized);
    const url = `https://data.baltimorecity.gov/resource/r7wy-f7n5.json?$limit=8&$q=${query}`;
    const response = await fetchWithTimeout(url, {
      signal: AbortSignal.timeout(4000),
      headers: baltimoreOpenDataHeaders()
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("No results");
    console.log(`[signals:infrastructure] live data - ${rows.length} records`);
    return parseInfrastructureSignals(rows, url);
  } catch (error) {
    console.warn("[signals:infrastructure] live fetch failed, using estimated signals:", error.message);
    return mockInfrastructureSignals(normalized);
  }
}

module.exports = { checkInfrastructureRisk };
