/** Email addresses treated as seeded demo identities and hidden from public session UI. */

const DEMO_EMAILS = new Set([
  "amira@harborcap.com",
  "jonah@rowhousefund.com",
  "talia@monumentlending.com"
]);

/** Returns true when the email belongs to the demo identity set. */
function isDemoEmail(email) {
  return Boolean(email && DEMO_EMAILS.has(String(email).toLowerCase()));
}

module.exports = { DEMO_EMAILS, isDemoEmail };
