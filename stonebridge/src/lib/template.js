const fs = require("fs");
const path = require("path");
const { getPublicBaseUrl } = require("./public-url");

const cache = new Map();

/** Reads and caches `views/<name>.html` from disk (cached in production). */
function loadTemplate(name) {
  const filePath = path.join(process.cwd(), "views", `${name}.html`);
  if (process.env.NODE_ENV === "production" && cache.has(name)) {
    return cache.get(name);
  }
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    const err = new Error(`Template not found or unreadable: ${name} (${error.code || error.message})`);
    err.statusCode = 500;
    err.cause = error;
    throw err;
  }
  cache.set(name, content);
  return content;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Replaces `{{key}}` (escaped) and `{{{key}}}` (raw) placeholders in a template file. */
function renderTemplate(name, data = {}) {
  let html = loadTemplate(name);
  html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => String(data[key] ?? ""));
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(data[key] ?? ""));
  return html;
}

/** Injects canonical + Open Graph + Twitter Card tags when a public base URL is known. */
function buildHeadSocialHtml({ path = "/", title, description }) {
  const base = getPublicBaseUrl();
  if (!base) return "";
  const p = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${base}${p === "//" ? "/" : p}`;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(canonicalUrl);
  return `
  <link rel="canonical" href="${u}">
  <meta name="theme-color" content="#1A1916">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${u}">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">`;
}

module.exports = { renderTemplate, escapeHtml, buildHeadSocialHtml };
