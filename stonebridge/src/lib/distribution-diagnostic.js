function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function addScore(parts, condition, points) {
  return condition ? parts + points : parts;
}

function analyzeDistributionDiagnostic(input) {
  const targetPartners = normalizeList(input.targetPartners);
  const materials = normalizeList(input.materials);
  const currentConstraint = String(input.currentConstraint || "").trim();
  const outreachState = String(input.outreachState || "").trim();
  const partnerModel = String(input.partnerModel || "").trim();
  const trackRecord = String(input.trackRecord || "").trim();
  const fundraisingGoal = String(input.fundraisingGoal || "").trim();

  let readinessScore = 20;
  readinessScore = addScore(readinessScore, trackRecord === "institutional", 25);
  readinessScore = addScore(readinessScore, trackRecord === "emerging", 15);
  readinessScore = addScore(readinessScore, materials.includes("deck"), 10);
  readinessScore = addScore(readinessScore, materials.includes("one-pager"), 10);
  readinessScore = addScore(readinessScore, materials.includes("faq"), 10);
  readinessScore = addScore(readinessScore, outreachState === "active", 15);
  readinessScore = addScore(readinessScore, outreachState === "testing", 8);
  readinessScore = addScore(readinessScore, targetPartners.length >= 3, 10);
  readinessScore = Math.min(readinessScore, 100);

  let primaryConstraint = "Offer clarity";
  let primaryConstraintBody = "The partner offer is not yet crisp enough for a third-party distributor to repeat it confidently.";

  if (currentConstraint === "partner-recruiting") {
    primaryConstraint = "Partner recruitment";
    primaryConstraintBody = "You likely know the basic story, but the channel for recruiting aligned capital partners is not systemized.";
  } else if (currentConstraint === "materials") {
    primaryConstraint = "Partner-facing materials";
    primaryConstraintBody = "The current fund story probably lives in conversations, not in assets a partner can use without hand-holding.";
  } else if (currentConstraint === "conversion") {
    primaryConstraint = "Partner conversion";
    primaryConstraintBody = "You are getting some conversations, but the economics, structure, or diligence framing is not moving partners to action.";
  } else if (currentConstraint === "distribution") {
    primaryConstraint = "Channel design";
    primaryConstraintBody = "The issue is broader than one deck or one intro. The partner channel itself needs to be defined and sequenced.";
  }

  const trackRecommendation = (() => {
    if (currentConstraint === "materials" || currentConstraint === "offer") {
      return "Distribution Readiness Buildout";
    }
    if (currentConstraint === "partner-recruiting" || currentConstraint === "distribution") {
      return "Partner Activation Sprint";
    }
    if (currentConstraint === "conversion") {
      return "Partner Offer Rework";
    }
    return "Diagnostic + Readiness Sprint";
  })();

  const partnerAngle = targetPartners.length
    ? `Current target partners: ${targetPartners.join(", ")}.`
    : "Target partner profile still needs to be defined.";

  const materialsStatus = materials.length
    ? `Existing materials: ${materials.join(", ")}.`
    : "No durable partner-facing materials are in place yet.";

  const urgency = fundraisingGoal
    ? `Stated raise target: ${fundraisingGoal}.`
    : "Raise target not specified.";

  const diagnosis = [
    {
      title: "Primary bottleneck",
      body: primaryConstraintBody
    },
    {
      title: "Partner readiness",
      body: `${materialsStatus} ${partnerAngle}`
    },
    {
      title: "Commercial implication",
      body: `${urgency} The next move should be to make the model easier to understand, trust, and place before adding more partner conversations.`
    }
  ];

  const nextActions = [
    `Clarify the ${partnerModel || "partner"} economics in one simple narrative a distributor can repeat in under two minutes.`,
    `Build or tighten the core partner asset set: deck, one-pager, FAQ, diligence framing, and objections sheet.`,
    `Run a focused partner channel process around ${targetPartners.length ? targetPartners.join(", ") : "the highest-fit partner types"} instead of broad outreach.`
  ];

  return {
    readinessScore,
    readinessBand: readinessScore >= 75 ? "Strong" : readinessScore >= 50 ? "Developing" : "Early",
    primaryConstraint,
    trackRecommendation,
    diagnosis,
    nextActions
  };
}

module.exports = {
  analyzeDistributionDiagnostic,
  normalizeList
};
