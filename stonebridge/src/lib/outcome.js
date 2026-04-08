const OUTCOMES = ["PROCEEDED", "RENEGOTIATED", "KILLED"];

/** Maps a confirmed client outcome to the post-memo risk score field. */
function outcomeToAfterScore(outcome) {
  if (outcome === "PROCEEDED") return 12;
  if (outcome === "RENEGOTIATED") return 48;
  if (outcome === "KILLED") return 92;
  return null;
}

/** Maps a confirmed client outcome to the post-memo flag count field. */
function outcomeToAfterFlags(outcome) {
  if (outcome === "PROCEEDED") return 2;
  if (outcome === "RENEGOTIATED") return 6;
  if (outcome === "KILLED") return 11;
  return null;
}

/** Returns a canonical outcome string or null when the client value is not allowed. */
function normalizeOutcome(outcome) {
  if (!outcome || typeof outcome !== "string") return null;
  const upper = outcome.trim().toUpperCase();
  return OUTCOMES.includes(upper) ? upper : null;
}

module.exports = { outcomeToAfterScore, outcomeToAfterFlags, OUTCOMES, normalizeOutcome };
