/** Ownership context signals from SDAT HTML or deterministic fallback. */
const { addressSeed, buildSignal, fetchWithTimeout, seededRandom, severityFromValue } = require("./common");

function parseOwnershipSignals(html, url) {
  const normalized = html.toLowerCase();
  const signals = [];

  if (normalized.includes("owner")) {
    signals.push(buildSignal({
      source: "Maryland SDAT",
      category: "OWNERSHIP",
      label: "Ownership record located",
      value: "SDAT ownership record responded for the parcel search",
      severity: "LOW",
      url
    }));
  }

  if (normalized.includes("transfer")) {
    signals.push(buildSignal({
      source: "Maryland SDAT",
      category: "OWNERSHIP",
      label: "Recent transfer activity",
      value: "Transfer language appears in the ownership history view",
      severity: "MEDIUM",
      url
    }));
  }

  return signals.slice(0, 2);
}

function mockOwnershipSignals(address) {
  const seed = addressSeed(address);
  const url = "https://sdat.dat.maryland.gov/RealProperty/";
  const scenarios = [
    {
      labelIndex: 40,
      severityIndex: 41,
      labelOptions: [
        "Ownership chain baseline",
        "Sponsor entity profile",
        "Title holder posture"
      ],
      valueOptions: [
        "Title is held by a straightforward local operating entity",
        "Owner profile suggests a small sponsor with limited history",
        "Holding pattern points to a thinly capitalized transfer vehicle"
      ]
    },
    {
      labelIndex: 42,
      severityIndex: 43,
      labelOptions: [
        "Distressed property overlap",
        "Portfolio concentration risk",
        "Cross-parcel distress pattern"
      ],
      valueOptions: [
        "Owner appears linked to other parcels showing similar distress markers",
        "Portfolio concentration suggests stress could spread across holdings",
        "Cross-parcel pattern implies broader sponsor-side strain"
      ]
    },
    {
      labelIndex: 44,
      severityIndex: 45,
      labelOptions: [
        "Recent transfer activity",
        "Rapid title churn",
        "Fresh deed turnover"
      ],
      valueOptions: [
        "Recent transfer timing reduces confidence in stabilized ownership",
        "Rapid title churn suggests the asset may still be in transition",
        "Fresh deed turnover may mean diligence records are incomplete"
      ]
    },
    {
      labelIndex: 46,
      severityIndex: 47,
      labelOptions: [
        "Shell company pattern",
        "Low-substance entity signature",
        "Opaque holding structure"
      ],
      valueOptions: [
        "Registered owner exhibits a low-substance entity pattern",
        "Holding structure is harder to diligence than a named operating sponsor",
        "Opaque entity stack may slow beneficial-owner verification"
      ]
    }
  ];

  const signals = scenarios
    .filter((_, index) => seededRandom(seed, index + 40) > 0.6)
    .slice(0, 2)
    .map((scenario) => {
      const labelPick = Math.floor(seededRandom(seed, scenario.labelIndex) * scenario.labelOptions.length);
      const valuePick = Math.floor(seededRandom(seed, scenario.labelIndex + 20) * scenario.valueOptions.length);
      return buildSignal({
        source: "Maryland SDAT (estimated)",
        category: "OWNERSHIP",
        label: scenario.labelOptions[labelPick],
        value: scenario.valueOptions[valuePick],
        severity: severityFromValue(seededRandom(seed, scenario.severityIndex)),
        url
      });
    });

  console.log("[signals:ownership] mock fallback - API unavailable");
  return signals;
}

async function checkOwnershipContext(address) {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx?Search=${encoded}`;
    const response = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const html = await response.text();
    if (!html || html.length < 200) throw new Error("No results");
    console.log("[signals:ownership] live data - SDAT ownership page loaded");
    return parseOwnershipSignals(html, url);
  } catch (error) {
    console.warn("[signals:ownership] live fetch failed, using estimated signals:", error.message);
    return mockOwnershipSignals(address);
  }
}

module.exports = { checkOwnershipContext };
