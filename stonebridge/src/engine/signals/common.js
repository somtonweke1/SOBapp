/** Shared helpers for address normalization, deterministic seeds, and Baltimore Open Data headers. */
const crypto = require("crypto");
const { config } = require("../../lib/config");

/** Derives a stable hash seed from an address string. */
function addressSeed(address) {
  return crypto.createHash("sha256").update(address.toLowerCase().trim()).digest("hex");
}

/** Generates deterministic pseudo-random values in [0, 1). */
function seededRandom(seed, index) {
  const value = crypto
    .createHash("sha256")
    .update(`${seed}:${index}`)
    .digest("hex")
    .slice(0, 8);
  return parseInt(value, 16) / 0xffffffff;
}

/** Maps a normalized value to the platform severity band. */
function severityFromValue(value) {
  if (value < 0.3) return "LOW";
  if (value < 0.6) return "MEDIUM";
  if (value < 0.85) return "HIGH";
  return "CRITICAL";
}

/** Uses global fetch when available and falls back for older runtimes. */
async function fetchWithTimeout(url, options = {}) {
  if (typeof fetch === "function") {
    return fetch(url, options);
  }
  const mod = await import("node-fetch");
  return mod.default(url, options);
}

/** Adds Socrata `X-App-Token` when `BALTIMORE_OPEN_DATA_APP_TOKEN` is configured. */
function baltimoreOpenDataHeaders() {
  return config.baltimoreAppToken ? { "X-App-Token": config.baltimoreAppToken } : {};
}

/** Picks a deterministic integer from an address hash range. */
function pickNumber(address, start, length, min, max) {
  const seed = addressSeed(address).slice(start, start + length);
  const value = parseInt(seed, 16);
  const range = max - min + 1;
  return min + (value % range);
}

/** Picks a deterministic value from a list using an address hash. */
function pickOne(address, start, values) {
  return values[pickNumber(address, start, 4, 0, values.length - 1)];
}

/** Normalizes freeform address input into a stable comparison string. */
function normalizeAddress(address) {
  return String(address || "").replace(/\s+/g, " ").trim();
}

/** Checks whether an address is detailed enough to run public-record diagnostics. */
function isLikelyAddress(address) {
  const normalized = normalizeAddress(address);
  if (normalized.length < 5) return false;

  const hasDigit = /\d/.test(normalized);

  // More flexible street marker matching - includes common abbreviations and variations
  const hasStreetMarker = /\b(st|street|ave|avenue|av|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|pl|place|way|pkwy|parkway|cir|circle|ter|terrace|sq|square|aly|alley)\b/i.test(normalized);

  // Accept if it has Baltimore/MD markers even without typical street markers
  const hasBaltimoreMarker = /\b(baltimore|balt|md|maryland|21\d{3})\b/i.test(normalized);

  // Valid if: has digit AND (street marker OR Baltimore marker)
  // OR: looks like a specific Baltimore format (digit + Baltimore/MD)
  return hasDigit && (hasStreetMarker || hasBaltimoreMarker);
}

/** Checks if address is in Baltimore CITY (not Baltimore County). Returns error message if not Baltimore City, null if valid. */
function validateBaltimoreCityAddress(address) {
  const normalized = normalizeAddress(address).toLowerCase();

  // Baltimore County areas (NOT Baltimore City) - explicitly reject these
  const baltimoreCountyAreas = [
    'towson', 'dundalk', 'essex', 'catonsville', 'owings mills', 'parkville',
    'rosedale', 'middle river', 'perry hall', 'woodlawn', 'pikesville',
    'randallstown', 'cockeysville', 'timonium', 'lutherville', 'hunt valley',
    'white marsh', 'overlea', 'arbutus', 'halethorpe', 'lansdowne'
  ];

  for (const area of baltimoreCountyAreas) {
    if (normalized.includes(area)) {
      return `This address appears to be in ${area.charAt(0).toUpperCase() + area.slice(1)}, which is Baltimore County. StoneBridge currently supports Baltimore City addresses only.`;
    }
  }

  // Check for explicit Baltimore City markers (good)
  const hasCityMarker = /\b(baltimore city|baltimore,?\s*md|21\d{3})\b/i.test(normalized);

  // If it has "Baltimore" in it, assume it's Baltimore City (user's intent)
  if (/\bbaltimore\b/i.test(normalized)) {
    return null; // Valid
  }

  // Baltimore City ZIP codes (21201-21231, 21239, 21251, 21264, 21270, 21273, 21275, 21278, 21279, 21280, 21281, 21282, 21283, 21284, 21285, 21286, 21287, 21289, 21290, 21297, 21298)
  const baltimoreCityZips = /\b(2120[1-9]|212[12]\d|21230|21231|21239|21251|21264|21270|21273|21275|21278|21279|21280|21281|21282|21283|21284|21285|21286|21287|21289|21290|21297|21298)\b/;
  if (baltimoreCityZips.test(normalized)) {
    return null; // Valid Baltimore City ZIP
  }

  // If has MD or Maryland but no Baltimore indicator, prompt user
  if (/\b(md|maryland)\b/i.test(normalized) && !/\bbaltimore\b/i.test(normalized)) {
    return 'Please include "Baltimore" in the address. StoneBridge analyzes Baltimore City addresses only.';
  }

  return null; // Default to allowing (benefit of the doubt)
}

/** Creates a normalized diagnostic signal object. */
function buildSignal({ source, category, label, value, severity, url }) {
  return { source, category, label, value, severity, url };
}

/** Extracts a ZIP code from an address or deterministically synthesizes one. */
function zipFromAddress(address) {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : `212${pickNumber(address, 8, 2, 0, 9)}`;
}

/**
 * Generates mock signals from scenario definitions using deterministic selection.
 * @param {string} address - Property address for seeding
 * @param {Array} scenarios - Array of scenario objects with category, labelIndex, severityIndex, labelOptions, valueOptions
 * @param {string} source - Signal source name (e.g., "Maryland SDAT (estimated)")
 * @param {string} url - Evidence URL
 * @param {number} baseIndex - Starting index for filtering (default: 10)
 * @param {number} maxSignals - Maximum number of signals to return (default: 2)
 * @returns {Array} Array of signal objects
 */
function generateMockSignals(address, scenarios, source, url, baseIndex = 10, maxSignals = 2) {
  const seed = addressSeed(address);

  return scenarios
    .filter((_, index) => seededRandom(seed, index + baseIndex) > 0.6)
    .slice(0, maxSignals)
    .map((scenario) => {
      const labelPick = Math.floor(seededRandom(seed, scenario.labelIndex) * scenario.labelOptions.length);
      const valuePick = Math.floor(seededRandom(seed, scenario.labelIndex + 20) * scenario.valueOptions.length);
      return buildSignal({
        source,
        category: scenario.category,
        label: scenario.labelOptions[labelPick],
        value: scenario.valueOptions[valuePick],
        severity: severityFromValue(seededRandom(seed, scenario.severityIndex)),
        url
      });
    });
}

module.exports = {
  addressSeed,
  seededRandom,
  severityFromValue,
  fetchWithTimeout,
  baltimoreOpenDataHeaders,
  pickNumber,
  pickOne,
  normalizeAddress,
  isLikelyAddress,
  validateBaltimoreCityAddress,
  buildSignal,
  zipFromAddress,
  generateMockSignals
};
