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
  const hasDigit = /\d/.test(normalized);
  const hasStreetMarker = /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|pl|place|way)\b/i.test(normalized);
  return normalized.length >= 10 && hasDigit && hasStreetMarker;
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
  buildSignal,
  zipFromAddress
};
