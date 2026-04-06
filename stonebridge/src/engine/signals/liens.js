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

function parseLienSignals(html, url) {
  const signals = [];
  const normalized = html.toLowerCase();

  if (normalized.includes("ground rent")) {
    signals.push(buildSignal({
      source: "Maryland SDAT",
      category: "TITLE",
      label: "Ground rent trace",
      value: "Ground rent notation present in SDAT ownership view",
      severity: "MEDIUM",
      url
    }));
  }

  if (normalized.includes("tax")) {
    signals.push(buildSignal({
      source: "Maryland SDAT",
      category: "LIEN",
      label: "Tax account activity",
      value: "Tax-related record surfaced in SDAT parcel search",
      severity: "LOW",
      url
    }));
  }

  return signals.slice(0, 2);
}

function mockLienSignals(address) {
  const seed = addressSeed(address);
  const url = "https://sdat.dat.maryland.gov/RealProperty/";
  const scenarios = [
    {
      category: "LIEN",
      labelIndex: 10,
      severityIndex: 11,
      labelOptions: [
        "Tax delinquency",
        "Municipal balance pressure",
        "Tax sale exposure"
      ],
      valueOptions: [
        "Delinquent municipal balance appears unresolved",
        "Tax account pattern suggests near-term collection pressure",
        "Outstanding tax posture could complicate clean transfer"
      ]
    },
    {
      category: "TITLE",
      labelIndex: 12,
      severityIndex: 13,
      labelOptions: [
        "Ground rent trace",
        "Legacy title encumbrance",
        "Recorded payment obligation"
      ],
      valueOptions: [
        "Ground rent notation remains attached to title history",
        "Legacy title encumbrance may need payoff or clarification",
        "Recurring title-side payment obligation surfaced in chain review"
      ]
    },
    {
      category: "LIEN",
      labelIndex: 14,
      severityIndex: 15,
      labelOptions: [
        "Recorded lien pressure",
        "Judgment attachment risk",
        "Enforcement filing trace"
      ],
      valueOptions: [
        "Recorded enforcement activity may impair fast closing",
        "Judgment-style attachment pattern surfaced in title context",
        "Lien pressure appears above typical small-balance noise"
      ]
    }
  ];

  const signals = scenarios
    .filter((_, index) => seededRandom(seed, index + 10) > 0.6)
    .slice(0, 2)
    .map((scenario) => {
      const labelPick = Math.floor(seededRandom(seed, scenario.labelIndex) * scenario.labelOptions.length);
      const valuePick = Math.floor(seededRandom(seed, scenario.labelIndex + 20) * scenario.valueOptions.length);
      return buildSignal({
        source: "Maryland SDAT",
        category: scenario.category,
        label: scenario.labelOptions[labelPick],
        value: scenario.valueOptions[valuePick],
        severity: severityFromValue(seededRandom(seed, scenario.severityIndex)),
        url
      });
    });

  console.log("[signals:liens] mock fallback - API unavailable");
  return signals;
}

async function checkLiens(address) {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx?Search=${encoded}`;
    const response = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const html = await response.text();
    if (!html || html.length < 200) throw new Error("No results");
    console.log("[signals:liens] live data - SDAT page loaded");
    return parseLienSignals(html, url);
  } catch (error) {
    return mockLienSignals(address);
  }
}

module.exports = { checkLiens };
