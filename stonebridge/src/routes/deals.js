const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { requireAuth } = require("../middleware/auth");
const { cancelIntent, captureIntent } = require("../lib/payments");
const { outcomeToAfterFlags, outcomeToAfterScore } = require("../lib/outcome");
const { serializeDeal, runDiagnosticForDeal } = require("../lib/deals");
const { readTokenFromRequest, setAuthCookie, signToken, verifyToken } = require("../lib/auth");

const router = express.Router();

async function optionalUser(req) {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return null;
    const payload = verifyToken(token);
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

async function getAuthorizedDealForUser(user, dealId) {
  const where = user.role === "OPERATOR"
    ? { id: dealId }
    : { id: dealId, clientId: user.id };

  return prisma.deal.findFirst({
    where,
    include: {
      client: { select: { id: true, email: true, name: true } }
    }
  });
}

async function buildCollaborationPayload(dealId) {
  const [documents, notes, frictions, summary, timeline] = await Promise.all([
    prisma.dealDocument.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, email: true } } }
    }),
    prisma.dealNote.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, email: true } } }
        }
      }
    }),
    prisma.dealMarketFriction.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, email: true } } }
    }),
    prisma.dealDecisionSummary.findUnique({
      where: { dealId },
      include: { updatedBy: { select: { id: true, name: true, email: true } } }
    }),
    prisma.timelineEvent.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  return { documents, notes, frictions, summary, timeline };
}

function canMutateCollabItem(user, item) {
  return user.role === "OPERATOR" || item.authorId === user.id;
}

router.post("/diagnose", asyncHandler(async (req, res) => {
  const address = String(req.body.address || "").trim();
  if (!address || address.length < 5) {
    return res.redirect("/submit?error=Please enter a valid address");
  }

  try {
    const reqUser = await optionalUser(req);
    const result = await require("../engine/diagnose").diagnose(address);

    let client = reqUser;
    if (!client) {
      client = await prisma.user.findUnique({ where: { email: "guest@stonebridge.ai" } });
      if (!client) {
        client = await prisma.user.create({
          data: {
            email: "guest@stonebridge.ai",
            password: await bcrypt.hash("guest", 10),
            name: "Guest",
            role: "CLIENT"
          }
        });
      }
    }

    setAuthCookie(res, signToken(client));

    const deal = await prisma.deal.create({
      data: {
        address,
        clientId: client.id,
        status: "MEMO_DELIVERED",
        verdict: result.verdict,
        riskScoreBefore: result.riskScore,
        flagCountBefore: result.flagCount,
        signalSources: [...new Set(result.signals.map(signal => signal.source))],
        memoDeliveredAt: new Date(),
        paymentStatus: "HELD",
        timeline: {
          create: [
            { event: "DEAL_SUBMITTED", detail: "Address submitted through public diagnostic flow" },
            { event: "DIAGNOSTIC_COMPLETE", detail: `Risk score: ${result.riskScore} | Verdict: ${result.verdict} | Signals: ${result.signals.length}` }
          ]
        }
      }
    });

    if (result.signals.length) {
      await prisma.signal.createMany({
        data: result.signals.map((sig) => ({
          dealId: deal.id,
          source: sig.source,
          category: sig.category,
          label: sig.label,
          severity: sig.severity,
          value: sig.value || sig.label,
          url: sig.url || null
        }))
      });
    }

    return res.redirect(`/deals/${deal.id}`);
  } catch (error) {
    console.error("[/diagnose]", error);
    return res.redirect("/submit?error=Something went wrong. Please try again.");
  }
}));

router.get("/:id", asyncHandler(async (req, res, next) => {
  if (req.params.id === "diagnose") return next();
  const deal = await prisma.deal.findUnique({
    where: { id: req.params.id },
    include: {
      signals: { orderBy: [{ severity: "desc" }, { pulledAt: "desc" }] },
      timeline: { orderBy: { createdAt: "asc" } },
      client: { select: { id: true, email: true, name: true } }
    }
  });
  if (!deal) return sendError(res, 404, "Deal not found");
  return res.json({ deal: serializeDeal(deal) });
}));

router.use(requireAuth);

router.post("/", asyncHandler(async (req, res) => {
  const { address, timelineStage, pressurePoint } = req.body;
  if (!address) return sendError(res, 400, "Address is required");

  const deal = await prisma.deal.create({
    data: {
      address,
      clientId: req.user.id,
      signalSources: [],
      timeline: {
        create: [
          { event: "DEAL_SUBMITTED", detail: `Stage: ${timelineStage || "unspecified"}; pressure: ${pressurePoint || "unspecified"}` }
        ]
      }
    },
    include: { timeline: true }
  });

  const result = await runDiagnosticForDeal(deal.id);
  const updated = await prisma.deal.findUnique({
    where: { id: deal.id },
    include: { signals: true, timeline: true }
  });

  res.status(201).json({
    deal: serializeDeal(updated),
    diagnostic: result
  });
}));

router.get("/", asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    where: { clientId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { signals: true, timeline: { orderBy: { createdAt: "asc" } } }
  });
  res.json({ deals: deals.map(serializeDeal) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: req.params.id, clientId: req.user.id },
    include: {
      signals: { orderBy: { pulledAt: "desc" } },
      timeline: { orderBy: { createdAt: "asc" } },
      client: { select: { id: true, email: true, name: true } }
    }
  });
  if (!deal) return sendError(res, 404, "Deal not found");
  res.json({ deal: serializeDeal(deal) });
}));

router.get("/:id/collaboration", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");
  res.json(await buildCollaborationPayload(deal.id));
}));

router.post("/:id/documents", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const label = String(req.body.label || "").trim();
  const url = String(req.body.url || "").trim();
  const kind = String(req.body.kind || "Document").trim();
  if (!label || !url) return sendError(res, 400, "Document label and URL are required");

  const document = await prisma.dealDocument.create({
    data: {
      dealId: deal.id,
      authorId: req.user.id,
      label,
      url,
      kind
    },
    include: { author: { select: { id: true, name: true, email: true } } }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "DOCUMENT_ADDED",
      detail: `${req.user.name || req.user.email} added ${label}`
    }
  });

  res.status(201).json({ document });
}));

router.post("/:id/notes", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const title = String(req.body.title || "").trim();
  const body = String(req.body.body || "").trim();
  const parentId = String(req.body.parentId || "").trim() || null;
  const mentions = Array.isArray(req.body.mentions) ? req.body.mentions.map((item) => String(item).trim()).filter(Boolean) : [];
  if (!title || !body) return sendError(res, 400, "Note title and body are required");
  if (parentId) {
    const parentNote = await prisma.dealNote.findFirst({ where: { id: parentId, dealId: deal.id } });
    if (!parentNote) return sendError(res, 400, "Parent note not found");
  }

  const note = await prisma.dealNote.create({
    data: {
      dealId: deal.id,
      authorId: req.user.id,
      parentId,
      title,
      body,
      mentions
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } }
      }
    }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "NOTE_CAPTURED",
      detail: `${req.user.name || req.user.email} captured note: ${title}`
    }
  });

  res.status(201).json({ note });
}));

router.post("/:id/notes/:noteId", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const existing = await prisma.dealNote.findFirst({
    where: { id: req.params.noteId, dealId: deal.id }
  });
  if (!existing) return sendError(res, 404, "Note not found");
  if (!canMutateCollabItem(req.user, existing)) return sendError(res, 403, "Cannot edit this note");

  const title = String(req.body.title || "").trim();
  const body = String(req.body.body || "").trim();
  const mentions = Array.isArray(req.body.mentions) ? req.body.mentions.map((item) => String(item).trim()).filter(Boolean) : [];
  if (!title || !body) return sendError(res, 400, "Note title and body are required");

  const note = await prisma.dealNote.update({
    where: { id: existing.id },
    data: { title, body, mentions },
    include: {
      author: { select: { id: true, name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } }
      }
    }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "NOTE_UPDATED",
      detail: `${req.user.name || req.user.email} updated note: ${title}`
    }
  });

  res.json({ note });
}));

router.delete("/:id/notes/:noteId", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const existing = await prisma.dealNote.findFirst({
    where: { id: req.params.noteId, dealId: deal.id }
  });
  if (!existing) return sendError(res, 404, "Note not found");
  if (!canMutateCollabItem(req.user, existing)) return sendError(res, 403, "Cannot delete this note");

  await prisma.dealNote.delete({ where: { id: existing.id } });
  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "NOTE_REMOVED",
      detail: `${req.user.name || req.user.email} removed note: ${existing.title}`
    }
  });

  res.json({ ok: true });
}));

router.post("/:id/frictions", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const category = String(req.body.category || "").trim();
  const observation = String(req.body.observation || "").trim();
  const impact = String(req.body.impact || "").trim();
  if (!category || !observation) return sendError(res, 400, "Friction category and observation are required");

  const friction = await prisma.dealMarketFriction.create({
    data: {
      dealId: deal.id,
      authorId: req.user.id,
      category,
      observation,
      impact: impact || null
    },
    include: { author: { select: { id: true, name: true, email: true } } }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "MARKET_FRICTION_LOGGED",
      detail: `${category}: ${observation}`
    }
  });

  res.status(201).json({ friction });
}));

router.post("/:id/frictions/:frictionId", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const existing = await prisma.dealMarketFriction.findFirst({
    where: { id: req.params.frictionId, dealId: deal.id }
  });
  if (!existing) return sendError(res, 404, "Market friction item not found");
  if (!canMutateCollabItem(req.user, existing)) return sendError(res, 403, "Cannot edit this market friction item");

  const category = String(req.body.category || "").trim();
  const observation = String(req.body.observation || "").trim();
  const impact = String(req.body.impact || "").trim();
  if (!category || !observation) return sendError(res, 400, "Friction category and observation are required");

  const friction = await prisma.dealMarketFriction.update({
    where: { id: existing.id },
    data: { category, observation, impact: impact || null },
    include: { author: { select: { id: true, name: true, email: true } } }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "MARKET_FRICTION_UPDATED",
      detail: `${category}: ${observation}`
    }
  });

  res.json({ friction });
}));

router.delete("/:id/frictions/:frictionId", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const existing = await prisma.dealMarketFriction.findFirst({
    where: { id: req.params.frictionId, dealId: deal.id }
  });
  if (!existing) return sendError(res, 404, "Market friction item not found");
  if (!canMutateCollabItem(req.user, existing)) return sendError(res, 403, "Cannot delete this market friction item");

  await prisma.dealMarketFriction.delete({ where: { id: existing.id } });
  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "MARKET_FRICTION_REMOVED",
      detail: `${req.user.name || req.user.email} removed a market friction item`
    }
  });

  res.json({ ok: true });
}));

router.post("/:id/summary", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const recommendation = String(req.body.recommendation || "").trim();
  const keyRisks = Array.isArray(req.body.keyRisks) ? req.body.keyRisks.map((item) => String(item).trim()).filter(Boolean) : [];
  const keyPositives = Array.isArray(req.body.keyPositives) ? req.body.keyPositives.map((item) => String(item).trim()).filter(Boolean) : [];
  const unresolvedQuestions = Array.isArray(req.body.unresolvedQuestions) ? req.body.unresolvedQuestions.map((item) => String(item).trim()).filter(Boolean) : [];

  if (!recommendation) return sendError(res, 400, "Recommendation is required");

  const summary = await prisma.dealDecisionSummary.upsert({
    where: { dealId: deal.id },
    update: {
      recommendation,
      keyRisks,
      keyPositives,
      unresolvedQuestions,
      updatedById: req.user.id
    },
    create: {
      dealId: deal.id,
      recommendation,
      keyRisks,
      keyPositives,
      unresolvedQuestions,
      updatedById: req.user.id
    },
    include: { updatedBy: { select: { id: true, name: true, email: true } } }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "DECISION_SUMMARY_UPDATED",
      detail: `${req.user.name || req.user.email} updated the collaboration summary`
    }
  });

  res.json({ summary });
}));

router.post("/:id/documents/:documentId", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const existing = await prisma.dealDocument.findFirst({
    where: { id: req.params.documentId, dealId: deal.id }
  });
  if (!existing) return sendError(res, 404, "Document not found");
  if (!canMutateCollabItem(req.user, existing)) return sendError(res, 403, "Cannot edit this document");

  const label = String(req.body.label || "").trim();
  const url = String(req.body.url || "").trim();
  const kind = String(req.body.kind || "Document").trim();
  if (!label || !url) return sendError(res, 400, "Document label and URL are required");

  const document = await prisma.dealDocument.update({
    where: { id: existing.id },
    data: { label, url, kind },
    include: { author: { select: { id: true, name: true, email: true } } }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "DOCUMENT_UPDATED",
      detail: `${req.user.name || req.user.email} updated ${label}`
    }
  });

  res.json({ document });
}));

router.delete("/:id/documents/:documentId", asyncHandler(async (req, res) => {
  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  const existing = await prisma.dealDocument.findFirst({
    where: { id: req.params.documentId, dealId: deal.id }
  });
  if (!existing) return sendError(res, 404, "Document not found");
  if (!canMutateCollabItem(req.user, existing)) return sendError(res, 403, "Cannot delete this document");

  await prisma.dealDocument.delete({ where: { id: existing.id } });
  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "DOCUMENT_REMOVED",
      detail: `${req.user.name || req.user.email} removed ${existing.label}`
    }
  });

  res.json({ ok: true });
}));

router.post("/:id/confirm-outcome", asyncHandler(async (req, res) => {
  const { outcome = "RENEGOTIATED", note = "Client confirmed memo was decision-grade" } = req.body;
  const deal = await prisma.deal.findFirst({
    where: { id: req.params.id, clientId: req.user.id }
  });
  if (!deal) return sendError(res, 404, "Deal not found");
  if (!deal.paymentIntentId) return sendError(res, 400, "Payment hold not found");

  await captureIntent(deal.paymentIntentId);
  const updated = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      status: "COMPLETED",
      paymentStatus: "RELEASED",
      outcomeConfirmedAt: new Date(),
      outcomeNote: note,
      riskScoreAfter: outcomeToAfterScore(outcome),
      flagCountAfter: outcomeToAfterFlags(outcome)
    },
    include: { signals: true, timeline: true }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "OUTCOME_CONFIRMED",
      detail: `${outcome}: ${note}`
    }
  });

  res.json({ deal: serializeDeal(updated) });
}));

router.post("/:id/dispute", asyncHandler(async (req, res) => {
  const { note = "Client disputed memo quality" } = req.body;
  const deal = await prisma.deal.findFirst({
    where: { id: req.params.id, clientId: req.user.id }
  });
  if (!deal) return sendError(res, 404, "Deal not found");
  if (!deal.paymentIntentId) return sendError(res, 400, "Payment hold not found");

  await cancelIntent(deal.paymentIntentId);
  const updated = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      status: "DISPUTED",
      paymentStatus: "REFUNDED",
      outcomeNote: note
    },
    include: { signals: true, timeline: true }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "MEMO_DISPUTED",
      detail: note
    }
  });

  res.json({ deal: serializeDeal(updated) });
}));

router.get("/:id/memo", asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: req.params.id, clientId: req.user.id }
  });
  if (!deal || !deal.memoPath) return sendError(res, 404, "Memo not found");
  if (!fs.existsSync(deal.memoPath)) return sendError(res, 404, "Memo file missing");
  res.download(deal.memoPath, `${deal.id}.pdf`);
}));

module.exports = router;
