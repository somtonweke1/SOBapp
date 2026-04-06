function outcomeToAfterScore(outcome) {
  if (outcome === "PROCEEDED") return 12;
  if (outcome === "RENEGOTIATED") return 48;
  if (outcome === "KILLED") return 92;
  return null;
}

function outcomeToAfterFlags(outcome) {
  if (outcome === "PROCEEDED") return 2;
  if (outcome === "RENEGOTIATED") return 6;
  if (outcome === "KILLED") return 11;
  return null;
}

function outcomeToLabel(outcome) {
  if (outcome === "PROCEEDED") return "Deal proceeded";
  if (outcome === "RENEGOTIATED") return "Deal renegotiated";
  if (outcome === "KILLED") return "Deal killed";
  return outcome || "Pending";
}

module.exports = { outcomeToAfterScore, outcomeToAfterFlags, outcomeToLabel };
