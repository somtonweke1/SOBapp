/** Identifies seeded demo deal rows so they stay out of public metrics and leaderboards. */

/** Returns true when a deal uses demo memo or payment identifiers. */
function isDemoDeal(deal) {
  const memoHash = String(deal?.memoHash || "").toLowerCase();
  const paymentIntentId = String(deal?.paymentIntentId || "").toLowerCase();
  return memoHash.startsWith("seeded-") ||
    memoHash.startsWith("prod-demo-") ||
    paymentIntentId.startsWith("pi_seed_") ||
    paymentIntentId.startsWith("pi_demo_");
}

module.exports = { isDemoDeal };
