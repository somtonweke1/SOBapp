const fs = require("fs");
const path = require("path");

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

module.exports = { renderTemplate, escapeHtml };
