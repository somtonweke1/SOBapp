/**
 * Canonical public origin for SEO, OG tags, and sitemaps.
 * Set PUBLIC_BASE_URL in production, or rely on Railway's public domain.
 */
function getPublicBaseUrl() {
  const explicit = process.env.PUBLIC_BASE_URL || process.env.PUBLIC_SITE_URL;
  if (explicit) return String(explicit).replace(/\/$/, "");
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (domain) {
    const host = String(domain).replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return "";
}

module.exports = { getPublicBaseUrl };
