/** Operator console API (global operator code, workspace owner, or `x-operator-access-code`). */
const express = require("express");
const { prisma } = require("../lib/prisma");
const { config } = require("../lib/config");
const { asyncHandler, sendError } = require("../lib/http");
const { requireAuth } = require("../middleware/auth");
const { deliverMemoForDeal, getPlatformStats, runDiagnosticForDeal, serializeDeal } = require("../lib/deals");
const { getActiveWorkspace, getInquiryAnalytics, getWorkspaceByOwnerId, serializeInquiry, serializeOpportunity, serializeWorkspace, serializeWorkspaceSummary } = require("../lib/sponsor");
const { isValidDealId } = require("../lib/validation");

const router = express.Router();

/** Rejects malformed cuid-style ids on routes that use `:id` (deals, inquiries, opportunities). */
router.param("id", (req, res, next, id) => {
  if (!isValidDealId(id)) return sendError(res, 400, "Invalid id");
  next();
});

router.use(requireAuth, asyncHandler(async (req, res, next) => {
  const accessCode = req.headers["x-operator-access-code"] || req.query.code;
  if (accessCode && accessCode === config.operatorAccessCode) {
    req.consoleScope = { mode: "global", viaAccessCode: true };
    return next();
  }
  if (req.user?.role === "OPERATOR") {
    req.consoleScope = { mode: "global", viaAccessCode: false };
    return next();
  }

  const workspace = await getWorkspaceByOwnerId(req.user.id);
  if (!workspace) {
    return sendError(res, 403, "Operator or workspace-owner access required");
  }
  req.consoleScope = { mode: "workspace", workspaceId: workspace.id, workspaceSlug: workspace.slug };
  next();
}));

async function getScopedWorkspace(req, includeOpportunities = true) {
  if (req.consoleScope.mode === "workspace") {
    return prisma.sponsorWorkspace.findUnique({
      where: { id: req.consoleScope.workspaceId },
      include: includeOpportunities ? { opportunities: { orderBy: { createdAt: "asc" } } } : undefined
    });
  }

  if (req.query.workspace) {
    return prisma.sponsorWorkspace.findUnique({
      where: { slug: String(req.query.workspace) },
      include: includeOpportunities ? { opportunities: { orderBy: { createdAt: "asc" } } } : undefined
    });
  }

  return getActiveWorkspace();
}

router.get("/deals", asyncHandler(async (_req, res) => {
  if (_req.consoleScope.mode === "workspace") {
    return res.json({ deals: [] });
  }

  // Pagination parameters with sensible defaults
  const page = Math.max(1, parseInt(_req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(_req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [deals, totalCount] = await Promise.all([
    prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        client: { select: { email: true, name: true } },
        signals: true,
        timeline: { orderBy: { createdAt: "asc" } }
      }
    }),
    prisma.deal.count()
  ]);

  res.json({
    deals: deals.map(serializeDeal),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + deals.length < totalCount
    }
  });
}));

router.get("/deals/:id", asyncHandler(async (req, res) => {
  if (req.consoleScope.mode === "workspace") return sendError(res, 403, "Diagnostics are operator-only");
  const deal = await prisma.deal.findUnique({
    where: { id: req.params.id },
    include: {
      client: { select: { email: true, name: true } },
      signals: { orderBy: { severity: "desc" } },
      timeline: { orderBy: { createdAt: "asc" } }
    }
  });
  if (!deal) return sendError(res, 404, "Deal not found");
  res.json({ deal: serializeDeal(deal) });
}));

router.post("/deals/:id/diagnose", asyncHandler(async (req, res) => {
  if (req.consoleScope.mode === "workspace") return sendError(res, 403, "Diagnostics are operator-only");
  const result = await runDiagnosticForDeal(req.params.id);
  res.json({ ok: true, diagnostic: result });
}));

router.post("/deals/:id/verdict", asyncHandler(async (req, res) => {
  if (req.consoleScope.mode === "workspace") return sendError(res, 403, "Diagnostics are operator-only");
  const { verdict } = req.body;
  if (!["PROCEED", "CAUTION", "ESCALATE"].includes(verdict)) {
    return sendError(res, 400, "Verdict must be PROCEED, CAUTION, or ESCALATE");
  }
  const updated = await prisma.deal.update({
    where: { id: req.params.id },
    data: { verdict },
    include: { signals: true, timeline: true }
  });
  await prisma.timelineEvent.create({
    data: {
      dealId: req.params.id,
      event: "VERDICT_SET",
      detail: `Operator set verdict ${verdict}`
    }
  });
  res.json({ deal: serializeDeal(updated) });
}));

router.post("/deals/:id/deliver", asyncHandler(async (req, res) => {
  if (req.consoleScope.mode === "workspace") return sendError(res, 403, "Diagnostics are operator-only");
  const memo = await deliverMemoForDeal(req.params.id);
  const deal = await prisma.deal.findUnique({
    where: { id: req.params.id },
    include: { signals: true, timeline: true }
  });
  res.json({ deal: serializeDeal(deal), memo });
}));

router.get("/stats", asyncHandler(async (_req, res) => {
  if (_req.consoleScope.mode === "workspace") {
    return res.json({
      totalDeals: 0,
      completedDeals: 0,
      signalsFused: 0,
      riskExposureMapped: "$0"
    });
  }
  const stats = await getPlatformStats();
  res.json(stats);
}));

router.get("/inquiries", asyncHandler(async (req, res) => {
  const scopedWorkspaceId = req.consoleScope.mode === "workspace"
    ? req.consoleScope.workspaceId
    : req.query.workspace
      ? (await prisma.sponsorWorkspace.findUnique({ where: { slug: String(req.query.workspace) }, select: { id: true } }))?.id
      : undefined;
  const analytics = await getInquiryAnalytics(scopedWorkspaceId);
  res.json(analytics);
}));

router.post("/inquiries/:id/status", asyncHandler(async (req, res) => {
  const { status, roomAccessGranted } = req.body;
  if (!["NEW", "QUALIFIED", "FOLLOW_UP", "ROOM_GRANTED", "CLOSED"].includes(status)) {
    return sendError(res, 400, "Invalid inquiry status");
  }

  const existing = await prisma.investorInquiry.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendError(res, 404, "Inquiry not found");
  if (req.consoleScope.mode === "workspace" && existing.workspaceId !== req.consoleScope.workspaceId) {
    return sendError(res, 403, "Cannot modify another workspace's inquiry");
  }

  const inquiry = await prisma.investorInquiry.update({
    where: { id: req.params.id },
    data: {
      status,
      roomAccessGranted: Boolean(roomAccessGranted) || status === "ROOM_GRANTED"
    },
    include: { workspace: true, opportunity: true }
  });

  res.json({ inquiry: serializeInquiry(inquiry) });
}));

router.get("/workspaces", asyncHandler(async (_req, res) => {
  const where = _req.consoleScope.mode === "workspace" ? { id: _req.consoleScope.workspaceId } : {};
  const workspaces = await prisma.sponsorWorkspace.findMany({
    where,
    orderBy: { createdAt: "asc" }
  });
  res.json({ workspaces: workspaces.map(serializeWorkspaceSummary) });
}));

router.get("/workspace", asyncHandler(async (req, res) => {
  const workspace = await getScopedWorkspace(req);
  if (!workspace) return sendError(res, 404, "No sponsor workspace configured");
  res.json({
    workspace: serializeWorkspace(workspace),
    opportunities: workspace.opportunities.map(serializeOpportunity)
  });
}));

router.post("/workspace", asyncHandler(async (req, res) => {
  const data = {
    name: String(req.body.name || "").trim(),
    slug: String(req.body.slug || "").trim(),
    strapline: String(req.body.strapline || "").trim(),
    overview: String(req.body.overview || "").trim(),
    fundName: String(req.body.fundName || "").trim(),
    targetRaise: String(req.body.targetRaise || "").trim(),
    targetProfile: String(req.body.targetProfile || "").trim(),
    geographies: Array.isArray(req.body.geographies) ? req.body.geographies.map((item) => String(item).trim()).filter(Boolean) : [],
    thesis: Array.isArray(req.body.thesis) ? req.body.thesis.map((item) => String(item).trim()).filter(Boolean) : [],
    metrics: Array.isArray(req.body.metrics) ? req.body.metrics : [],
    trackRecord: Array.isArray(req.body.trackRecord) ? req.body.trackRecord : [],
    faqs: Array.isArray(req.body.faqs) ? req.body.faqs : [],
    isActive: req.body.isActive !== false
  };

  if (!data.name || !data.slug || !data.overview || !data.fundName) {
    return sendError(res, 400, "Workspace name, slug, overview, and fund name are required");
  }

  const existingBySlug = await prisma.sponsorWorkspace.findUnique({ where: { slug: data.slug } });
  const current = req.consoleScope.mode === "workspace"
    ? await getWorkspaceByOwnerId(req.user.id)
    : req.body.id
      ? await prisma.sponsorWorkspace.findUnique({ where: { id: String(req.body.id) } })
      : existingBySlug;

  if (existingBySlug && current?.id !== existingBySlug.id) {
    return sendError(res, 409, "Workspace slug already exists");
  }

  const workspace = current
    ? await prisma.sponsorWorkspace.update({ where: { id: current.id }, data: { ...data, ownerId: current.ownerId || (req.consoleScope.mode === "workspace" ? req.user.id : current.ownerId) } })
    : await prisma.sponsorWorkspace.create({ data: { ...data, ownerId: req.consoleScope.mode === "workspace" ? req.user.id : null } });

  res.json({ workspace: serializeWorkspace(workspace) });
}));

router.post("/opportunities", asyncHandler(async (req, res) => {
  const workspace = await getScopedWorkspace(req, false);
  if (!workspace) return sendError(res, 404, "No sponsor workspace configured");

  const data = {
    title: String(req.body.title || "").trim(),
    slug: String(req.body.slug || "").trim(),
    market: String(req.body.market || "").trim(),
    assetType: String(req.body.assetType || "").trim(),
    stage: String(req.body.stage || "").trim(),
    targetEquity: String(req.body.targetEquity || "").trim(),
    targetHold: String(req.body.targetHold || "").trim(),
    summary: String(req.body.summary || "").trim(),
    thesis: Array.isArray(req.body.thesis) ? req.body.thesis.map((item) => String(item).trim()).filter(Boolean) : [],
    diligence: Array.isArray(req.body.diligence) ? req.body.diligence.map((item) => String(item).trim()).filter(Boolean) : [],
    roomNotes: Array.isArray(req.body.roomNotes) ? req.body.roomNotes.map((item) => String(item).trim()).filter(Boolean) : [],
    isActive: req.body.isActive !== false
  };

  if (!data.title || !data.slug || !data.market || !data.summary) {
    return sendError(res, 400, "Opportunity title, slug, market, and summary are required");
  }

  const existing = await prisma.sponsorOpportunity.findUnique({ where: { slug: data.slug } });
  if (existing && existing.workspaceId !== workspace.id) {
    return sendError(res, 409, "Opportunity slug already exists in another workspace");
  }

  const opportunity = existing
    ? await prisma.sponsorOpportunity.update({ where: { id: existing.id }, data })
    : await prisma.sponsorOpportunity.create({
      data: {
        ...data,
        workspaceId: workspace.id
      }
    });

  res.json({ opportunity: serializeOpportunity(opportunity) });
}));

router.post("/opportunities/:id", asyncHandler(async (req, res) => {
  const opportunity = await prisma.sponsorOpportunity.findUnique({
    where: { id: req.params.id }
  });
  if (!opportunity) return sendError(res, 404, "Opportunity not found");
  if (req.consoleScope.mode === "workspace" && opportunity.workspaceId !== req.consoleScope.workspaceId) {
    return sendError(res, 403, "Cannot modify another workspace's opportunity");
  }

  const data = {
    title: String(req.body.title || "").trim(),
    slug: String(req.body.slug || "").trim(),
    market: String(req.body.market || "").trim(),
    assetType: String(req.body.assetType || "").trim(),
    stage: String(req.body.stage || "").trim(),
    targetEquity: String(req.body.targetEquity || "").trim(),
    targetHold: String(req.body.targetHold || "").trim(),
    summary: String(req.body.summary || "").trim(),
    thesis: Array.isArray(req.body.thesis) ? req.body.thesis.map((item) => String(item).trim()).filter(Boolean) : [],
    diligence: Array.isArray(req.body.diligence) ? req.body.diligence.map((item) => String(item).trim()).filter(Boolean) : [],
    roomNotes: Array.isArray(req.body.roomNotes) ? req.body.roomNotes.map((item) => String(item).trim()).filter(Boolean) : [],
    isActive: req.body.isActive !== false
  };

  if (!data.title || !data.slug || !data.market || !data.summary) {
    return sendError(res, 400, "Opportunity title, slug, market, and summary are required");
  }

  const existingBySlug = await prisma.sponsorOpportunity.findUnique({ where: { slug: data.slug } });
  if (existingBySlug && existingBySlug.id !== opportunity.id) {
    return sendError(res, 409, "Opportunity slug already exists");
  }

  const updated = await prisma.sponsorOpportunity.update({
    where: { id: req.params.id },
    data
  });

  res.json({ opportunity: serializeOpportunity(updated) });
}));

router.post("/opportunities/:id/archive", asyncHandler(async (req, res) => {
  const { isActive = false } = req.body;
  const existing = await prisma.sponsorOpportunity.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendError(res, 404, "Opportunity not found");
  if (req.consoleScope.mode === "workspace" && existing.workspaceId !== req.consoleScope.workspaceId) {
    return sendError(res, 403, "Cannot modify another workspace's opportunity");
  }
  const opportunity = await prisma.sponsorOpportunity.update({
    where: { id: req.params.id },
    data: { isActive: Boolean(isActive) }
  });

  res.json({ opportunity: serializeOpportunity(opportunity) });
}));

module.exports = router;
