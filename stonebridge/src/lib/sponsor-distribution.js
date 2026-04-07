function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function inferPartnerTypes(workspace, opportunities) {
  const profile = String(workspace.targetProfile || "").toLowerCase();
  const geographies = normalizeArray(workspace.geographies).map((item) => String(item).toLowerCase());
  const assetTypes = opportunities.map((item) => String(item.assetType || "").toLowerCase());
  const partners = [];

  if (profile.includes("accredited")) partners.push("Capital Aggregators");
  if (profile.includes("family office")) partners.push("Family Office Networks");
  if (profile.includes("advisor") || profile.includes("ria")) partners.push("RIAs / Advisors");
  if (profile.includes("fund")) partners.push("Fund-of-Funds Managers");
  if (assetTypes.some((item) => item.includes("storage") || item.includes("industrial") || item.includes("flex"))) {
    partners.push("Real Estate Syndicators");
  }
  if (geographies.length > 1) partners.push("Regional Capital Partners");

  return [...new Set(partners)].slice(0, 4);
}

function getPrimaryConstraint(workspace, opportunities) {
  const faqs = normalizeArray(workspace.faqs);
  const trackRecord = normalizeArray(workspace.trackRecord);
  const metrics = normalizeArray(workspace.metrics);

  if (faqs.length < 3) {
    return {
      title: "Offer clarity",
      body: "The sponsor story likely still depends on live explanation instead of durable partner-ready framing."
    };
  }

  if (trackRecord.length < 2 || metrics.length < 2) {
    return {
      title: "Proof packaging",
      body: "The underlying track record may be real, but the visible proof layer is still too thin for a third-party capital partner."
    };
  }

  if (opportunities.length === 0) {
    return {
      title: "Pipeline packaging",
      body: "The workspace has sponsor context, but it does not yet surface enough active opportunity packaging to convert partner interest."
    };
  }

  return {
    title: "Partner activation",
    body: "The workspace has the basics in place. The next constraint is turning the sponsor surface into a repeatable partner-acquisition motion."
  };
}

function calculateReadiness(workspace, opportunities) {
  const faqs = normalizeArray(workspace.faqs);
  const trackRecord = normalizeArray(workspace.trackRecord);
  const metrics = normalizeArray(workspace.metrics);
  const thesis = normalizeArray(workspace.thesis);

  let score = 35;
  if (trackRecord.length >= 3) score += 18;
  else if (trackRecord.length >= 1) score += 10;

  if (metrics.length >= 3) score += 14;
  else if (metrics.length >= 1) score += 8;

  if (faqs.length >= 4) score += 14;
  else if (faqs.length >= 2) score += 8;

  if (thesis.length >= 3) score += 10;
  else if (thesis.length >= 1) score += 5;

  if (opportunities.length >= 2) score += 12;
  else if (opportunities.length === 1) score += 6;

  score = Math.min(score, 96);
  return {
    score,
    band: score >= 75 ? "Strong" : score >= 55 ? "Developing" : "Early"
  };
}

function buildDistributionIntelligence(workspace, opportunities) {
  const readiness = calculateReadiness(workspace, opportunities);
  const primaryConstraint = getPrimaryConstraint(workspace, opportunities);
  const partnerTypes = inferPartnerTypes(workspace, opportunities);

  const missingAssets = [];
  if (normalizeArray(workspace.faqs).length < 3) missingAssets.push("Partner FAQ");
  if (normalizeArray(workspace.trackRecord).length < 2) missingAssets.push("Track record proof sheet");
  if (opportunities.length < 2) missingAssets.push("Opportunity brief set");
  if (!String(workspace.targetProfile || "").trim()) missingAssets.push("Target partner profile");

  const recommendedTrack =
    primaryConstraint.title === "Offer clarity" ? "Partner Offer Rework" :
    primaryConstraint.title === "Proof packaging" ? "Distribution Readiness Buildout" :
    primaryConstraint.title === "Pipeline packaging" ? "Opportunity Packaging Sprint" :
    "Partner Activation Sprint";

  const actionPlan = [
    `Sharpen the sponsor narrative around ${workspace.fundName || workspace.name} so a partner can explain the model without a live walkthrough.`,
    `Build the missing partner-facing assets first: ${missingAssets.length ? missingAssets.join(", ") : "outreach sequence and objections handling"}.`,
    `Prioritize outreach to ${partnerTypes.length ? partnerTypes.join(", ") : "the highest-fit capital partner types"} instead of broad capital raising conversations.`
  ];

  return {
    readiness,
    primaryConstraint,
    partnerTypes,
    missingAssets,
    recommendedTrack,
    actionPlan
  };
}

module.exports = {
  buildDistributionIntelligence
};
