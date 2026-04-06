const crypto = require("crypto");
const { config } = require("../../lib/config");

async function compatibleFetch(url, options) {
  if (typeof fetch === "function") {
    return fetch(url, options);
  }
  const mod = await import("node-fetch");
  return mod.default(url, options);
}

function addressSeed(address) {
  return crypto.createHash("sha256").update(address.toLowerCase().trim()).digest("hex");
}

function pickNumber(address, start, length, min, max) {
  const seed = addressSeed(address).slice(start, start + length);
  const value = parseInt(seed, 16);
  const range = max - min + 1;
  return min + (value % range);
}

function pickOne(address, start, values) {
  return values[pickNumber(address, start, 4, 0, values.length - 1)];
}

function buildSignal({ source, category, label, value, severity, url }) {
  return { source, category, label, value, severity, url };
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 5000);
  try {
    const response = await compatibleFetch(url, {
      headers: {
        "X-App-Token": config.baltimoreAppToken || "",
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function zipFromAddress(address) {
  const match = address.match(/\b(\d{5})\b/);
  return match ? match[1] : `212${pickNumber(address, 8, 2, 0, 9)}`;
}

module.exports = {
  addressSeed,
  pickNumber,
  pickOne,
  buildSignal,
  fetchJson,
  zipFromAddress
};
