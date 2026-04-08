/** Public and authenticated JSON for sponsor workspaces, opportunities, and investor inquiries. */
const express = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const {
  createAccessCode,
  getActiveWorkspace,
  getOpportunityBySlug,
  getWorkspaceBySlug,
  getWorkspaceOverview,
  listActiveWorkspaces,
  serializeInquiry,
  serializeOpportunity,
  serializeWorkspace
} = require("../lib/sponsor");
const { isValidEmail, isValidWorkspaceSlug } = require("../lib/validation");

const router = express.Router();

router.get("/workspaces", asyncHandler(async (_req, res) => {
  const workspaces = await listActiveWorkspaces();
  res.json({ workspaces });
}));

router.param("workspaceSlug", (req, res, next, slug) => {
  if (!isValidWorkspaceSlug(slug)) return sendError(res, 400, "Invalid workspace slug");
  next();
});

router.get("/:workspaceSlug/overview", asyncHandler(async (req, res) => {
  const [completedDeals, releasedCapital] = await Promise.all([
    prisma.deal.count({ where: { status: "COMPLETED" } }),
    prisma.deal.aggregate({
      _sum: { amountCents: true },
      where: { paymentStatus: "RELEASED" }
    })
  ]);

  const overview = await getWorkspaceOverview(req.params.workspaceSlug);
  res.json({
    ...overview,
    liveMetrics: {
      completedDeals,
      releasedCapital: `$${Math.round((releasedCapital._sum.amountCents || 0) / 100).toLocaleString()}`
    }
  });
}));

router.get("/:workspaceSlug/opportunities/:slug", asyncHandler(async (req, res) => {
  const opportunity = await getOpportunityBySlug(req.params.workspaceSlug, req.params.slug);
  if (!opportunity) return sendError(res, 404, "Opportunity not found");
  res.json({ opportunity: serializeOpportunity(opportunity), workspace: serializeWorkspace(opportunity.workspace) });
}));

router.post("/:workspaceSlug/inquiries", asyncHandler(async (req, res) => {
  const {
    name,
    email,
    firm,
    investorType,
    checkSize,
    interestLevel,
    accredited,
    targetMarkets = [],
    opportunitySlug,
    timeline,
    message
  } = req.body;

  if (!name || !email || !investorType || !checkSize || !interestLevel) {
    return sendError(res, 400, "Name, email, investor type, check size, and interest level are required");
  }
  const emailNorm = String(email).trim().toLowerCase();
  if (!isValidEmail(emailNorm)) return sendError(res, 400, "Enter a valid email address");

  const workspace = await getWorkspaceBySlug(req.params.workspaceSlug);
  if (!workspace) return sendError(res, 404, "No sponsor workspace configured");
  const opportunity = opportunitySlug ? await getOpportunityBySlug(req.params.workspaceSlug, opportunitySlug) : null;
  if (opportunitySlug && !opportunity) return sendError(res, 400, "Unknown opportunity");

  const inquiry = await prisma.investorInquiry.create({
    data: {
      name: String(name).trim(),
      email: emailNorm,
      firm: String(firm || "").trim() || null,
      investorType: String(investorType).trim(),
      checkSize: String(checkSize).trim(),
      interestLevel: String(interestLevel).trim(),
      accredited: Boolean(accredited),
      targetMarkets: Array.isArray(targetMarkets) ? targetMarkets.map((item) => String(item).trim()).filter(Boolean) : [],
      workspaceId: workspace.id,
      opportunityId: opportunity?.id || null,
      timeline: String(timeline || "").trim() || null,
      message: String(message || "").trim() || null,
      accessCode: createAccessCode()
    },
    include: { workspace: true, opportunity: true }
  });

  res.status(201).json({
    ok: true,
    inquiry: serializeInquiry(inquiry),
    nextStep: "Inquiry captured. Sponsor team can now qualify and selectively grant room access."
  });
}));

router.get("/:workspaceSlug/room/:slug", asyncHandler(async (req, res) => {
  const opportunity = await getOpportunityBySlug(req.params.workspaceSlug, req.params.slug);
  if (!opportunity) return sendError(res, 404, "Opportunity not found");

  const accessCode = String(req.query.access || "").trim();
  if (!accessCode) return sendError(res, 401, "Access code required");

  const inquiry = await prisma.investorInquiry.findUnique({
    where: { accessCode },
    include: { opportunity: true }
  });

  if (!inquiry || !inquiry.roomAccessGranted || inquiry.opportunity?.slug !== req.params.slug) {
    return sendError(res, 403, "Room access not granted");
  }

  await prisma.investorInquiry.update({
    where: { id: inquiry.id },
    data: { lastViewedAt: new Date() }
  });

  res.json({
    opportunity: serializeOpportunity(opportunity),
    workspace: serializeWorkspace(opportunity.workspace),
    room: {
      grantedTo: inquiry.name,
      firm: inquiry.firm,
      accessCode: inquiry.accessCode,
      notes: opportunity.roomNotes
    }
  });
}));

router.get("/overview", asyncHandler(async (_req, res) => {
  const workspace = await getActiveWorkspace();
  if (!workspace) return sendError(res, 404, "No sponsor workspace configured");
  res.redirect(302, `/api/sponsor/${workspace.slug}/overview`);
}));

module.exports = router;
