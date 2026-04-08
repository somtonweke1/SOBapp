/** Input guards and normalizers for HTTP boundaries (no business rules beyond shape and size). */

const MAX_ADDRESS_LENGTH = 500;
const MAX_NOTE_LENGTH = 4000;
const MAX_SLUG_LENGTH = 80;
const DEAL_ID_RE = /^[a-z0-9]{20,36}$/i;

/** Trims and lowercases an email-like string for lookup. */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/** Returns true when the string looks like a deliverable email address. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

/** Returns true when the id matches Prisma cuid-style identifiers used for deals. */
function isValidDealId(id) {
  return typeof id === "string" && DEAL_ID_RE.test(id);
}

/** Returns true for URL-safe sponsor workspace slugs. */
function isValidWorkspaceSlug(slug) {
  if (typeof slug !== "string") return false;
  const s = slug.trim();
  if (s.length < 2 || s.length > MAX_SLUG_LENGTH) return false;
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(s);
}

/** Truncates free-text address input to a safe maximum length. */
function clampAddress(address) {
  return String(address || "").trim().slice(0, MAX_ADDRESS_LENGTH);
}

/** Truncates long notes to avoid oversized DB rows. */
function clampNote(note, max = MAX_NOTE_LENGTH) {
  return String(note || "").trim().slice(0, max);
}

module.exports = {
  MAX_ADDRESS_LENGTH,
  MAX_NOTE_LENGTH,
  normalizeEmail,
  isValidEmail,
  isValidDealId,
  isValidWorkspaceSlug,
  clampAddress,
  clampNote
};
