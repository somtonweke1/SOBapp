const fs = require("fs");
const path = require("path");

const cache = new Map();

function loadTemplate(name) {
  const filePath = path.join(process.cwd(), "views", `${name}.html`);
  if (process.env.NODE_ENV === "production" && cache.has(name)) {
    return cache.get(name);
  }
  const content = fs.readFileSync(filePath, "utf8");
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

function renderTemplate(name, data = {}) {
  let html = loadTemplate(name);
  html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => String(data[key] ?? ""));
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(data[key] ?? ""));
  return html;
}

module.exports = { renderTemplate, escapeHtml };
