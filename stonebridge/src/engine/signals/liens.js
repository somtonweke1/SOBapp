/** Maryland SDAT / lien-style signals from HTML scrape or deterministic fallback. */
const { buildSignal, fetchWithTimeout, generateMockSignals } = require("./common");

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

  if (/\b(tax|taxes)\b/.test(normalized)) {
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

/** Generates mock lien signals when SDAT scraping is unavailable. */
function mockLienSignals(address) {
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

  console.log("[signals:liens] mock fallback - API unavailable");
  return generateMockSignals(
    address,
    scenarios,
    "Maryland SDAT (estimated)",
    "https://sdat.dat.maryland.gov/RealProperty/",
    10,
    2
  );
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
    console.warn("[signals:liens] live fetch failed, using estimated signals:", error.message);
    return mockLienSignals(address);
  }
}

module.exports = { checkLiens };
