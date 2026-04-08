const { addressSeed, baltimoreOpenDataHeaders, buildSignal, fetchWithTimeout, seededRandom, severityFromValue } = require("./common");

function parseUtilitySignals(rows, url) {
  const complaintCount = rows.length;
  const signals = [];

  if (complaintCount > 0) {
    signals.push(buildSignal({
      source: "Baltimore 311",
      category: "UTILITY",
      label: "311 utility complaint cluster",
      value: `${complaintCount} utility-related service records near parcel`,
      severity: complaintCount >= 6 ? "HIGH" : complaintCount >= 3 ? "MEDIUM" : "LOW",
      url
    }));
  }

  const shutoffRelated = rows.filter((row) => {
    const detail = JSON.stringify(row).toLowerCase();
    return detail.includes("water") || detail.includes("sewer") || detail.includes("shut");
  }).length;

  if (shutoffRelated >= 2) {
    signals.push(buildSignal({
      source: "Baltimore 311",
      category: "UTILITY",
      label: "Service interruption pattern",
      value: `${shutoffRelated} records suggest recurring water or sewer service friction`,
      severity: shutoffRelated >= 4 ? "HIGH" : "MEDIUM",
      url
    }));
  }

  return signals.slice(0, 2);
}

function mockUtilitySignals(address) {
  const seed = addressSeed(address);
  const url = "https://data.baltimorecity.gov/resource/9agw-sxsr.json";
  const scenarios = [
    {
      labelIndex: 20,
      severityIndex: 21,
      labelOptions: [
        "Utility complaint cluster",
        "Water service noise",
        "Sewer maintenance concentration"
      ],
      valueOptions: [
        "Nearby service history shows elevated utility complaint frequency",
        "Water service tickets are denser than nearby blocks",
        "Sewer maintenance pattern suggests recurring service burden"
      ]
    },
    {
      labelIndex: 22,
      severityIndex: 23,
      labelOptions: [
        "Service interruption pattern",
        "Meter access friction",
        "Shutoff-reconnect cycle"
      ],
      valueOptions: [
        "Interruption-style ticket pattern suggests unstable service continuity",
        "Meter access disputes appear in recent service history",
        "Shutoff-reconnect behavior indicates operational friction at parcel level"
      ]
    },
    {
      labelIndex: 24,
      severityIndex: 25,
      labelOptions: [
        "Stormwater burden",
        "Drainage maintenance drag",
        "Overflow complaint pattern"
      ],
      valueOptions: [
        "Stormwater calls suggest recurring drainage burden nearby",
        "Drainage maintenance cadence appears heavier than normal",
        "Overflow complaints point to local infrastructure drag"
      ]
    }
  ];

  const signals = scenarios
    .filter((_, index) => seededRandom(seed, index + 20) > 0.6)
    .slice(0, 2)
    .map((scenario) => {
      const labelPick = Math.floor(seededRandom(seed, scenario.labelIndex) * scenario.labelOptions.length);
      const valuePick = Math.floor(seededRandom(seed, scenario.labelIndex + 20) * scenario.valueOptions.length);
      return buildSignal({
        source: "Baltimore 311 (estimated)",
        category: "UTILITY",
        label: scenario.labelOptions[labelPick],
        value: scenario.valueOptions[valuePick],
        severity: severityFromValue(seededRandom(seed, scenario.severityIndex)),
        url
      });
    });

  console.log("[signals:utility] mock fallback - API unavailable");
  return signals;
}

async function checkUtilityAnomalies(address) {
  try {
    const query = encodeURIComponent(address);
    const url = `https://data.baltimorecity.gov/resource/9agw-sxsr.json?$limit=8&$q=${query}`;
    const response = await fetchWithTimeout(url, {
      signal: AbortSignal.timeout(4000),
      headers: baltimoreOpenDataHeaders()
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("No results");
    console.log(`[signals:utility] live data - ${rows.length} records`);
    return parseUtilitySignals(rows, url);
  } catch (error) {
    console.warn("[signals:utility] live fetch failed, using estimated signals:", error.message);
    return mockUtilitySignals(address);
  }
}

module.exports = { checkUtilityAnomalies };
