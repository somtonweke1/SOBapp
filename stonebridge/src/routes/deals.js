/** Client deal CRUD, collaboration, and the public `POST /diagnose` preview flow. */
const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { requireAuth } = require("../middleware/auth");
const { cancelIntent, captureIntent } = require("../lib/payments");
const { outcomeToAfterFlags, outcomeToAfterScore, normalizeOutcome } = require("../lib/outcome");
const { serializeDeal, runDiagnosticForDeal } = require("../lib/deals");
const { setAuthCookie, signToken } = require("../lib/auth");
const { loadSessionUser, hideDemoPublicUser } = require("../lib/request-user");
const { isLikelyAddress, normalizeAddress } = require("../engine/signals/common");
const {
  clampAddress,
  clampNote,
  isValidDealId,
  isValidEmail,
  MAX_ADDRESS_LENGTH
} = require("../lib/validation");

const router = express.Router();

router.param("id", (req, res, next, id) => {
  if (!isValidDealId(id)) return sendError(res, 400, "Invalid deal id");
  next();
});

/** Resolves the session user for public flows, hiding demo identities and returning null for guest users. */
async function getSessionUserOrNull(req) {
  const user = await loadSessionUser(req);
  return hideDemoPublicUser(user);
}

/** Loads a deal only if the current user is allowed to see it. */
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

/** Loads collaboration records for a deal in a single request bundle. */
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

/** Checks whether the current user can edit a collaboration item. */
function canMutateCollabItem(user, item) {
  return user.role === "OPERATOR" || item.authorId === user.id;
}

/** Converts an arbitrary field into a trimmed string. */
function normalizeString(value) {
  return String(value || "").trim();
}

/** Converts checkbox or repeated values into a normalized string array. */
function normalizeStringArray(value) {
  return Array.isArray(value) ? value.map((item) => normalizeString(item)).filter(Boolean) : [];
}

router.post("/diagnose", asyncHandler(async (req, res) => {
  const normalized = normalizeAddress(req.body.address);
  if (normalized.length > MAX_ADDRESS_LENGTH) {
    return res.redirect("/submit?error=Address is too long");
  }
  const address = clampAddress(normalized);
  if (!isLikelyAddress(address)) {
    return res.redirect("/submit?error=Please enter a valid address");
  }

  try {
    const reqUser = await getSessionUserOrNull(req);
    const result = await require("../engine/diagnose").diagnose(address);

    let client = reqUser;
    if (!client) {
      client = await prisma.user.upsert({
        where: { email: "guest@stonebridge.ai" },
        update: {},
        create: {
          email: "guest@stonebridge.ai",
          password: await bcrypt.hash("guest", 10),
          name: "Guest",
          role: "CLIENT"
        }
      });
    }

    setAuthCookie(res, signToken(client));

    const deal = await prisma.$transaction(async (tx) => {
      const created = await tx.deal.create({
        data: {
          address,
          clientId: client.id,
          status: "PENDING",
          verdict: result.verdict,
          riskScoreBefore: result.riskScore,
          flagCountBefore: result.flagCount,
          signalSources: [...new Set(result.signals.map((signal) => signal.source))],
          paymentStatus: "UNPAID",
          timeline: {
            create: [
              { event: "DEAL_SUBMITTED", detail: "Address submitted through public diagnostic flow" },
              {
                event: "PREVIEW_GENERATED",
                detail: `Free preview generated. Risk score: ${result.riskScore} | Verdict: ${result.verdict} | Signals: ${result.signals.length}${result.sourceStatus.rejected ? ` | Source rejections: ${result.sourceStatus.rejected}` : ""}${result.sourceStatus.estimatedSignalCount ? ` | Estimated signals: ${result.sourceStatus.estimatedSignalCount}` : ""}${result.dataQuality?.scoreCappedForEstimatedOnly ? " | Score capped (estimated-only preview)" : ""}`
              }
            ]
          }
        }
      });

      if (result.signals.length) {
        await tx.signal.createMany({
          data: result.signals.map((sig) => ({
            dealId: created.id,
            source: sig.source,
            category: sig.category,
            label: sig.label,
            severity: sig.severity,
            value: sig.value || sig.label,
            url: sig.url || null
          }))
        });
      }

      return created;
    });

    return res.redirect(`/deals/${deal.id}`);
  } catch (error) {
    console.error("[/diagnose]", error);
    return res.redirect("/submit?error=Something went wrong. Please try again.");
  }
}));

router.use(requireAuth);

/** Memo intake after authentication so `req.user` is set and ownership is enforced. */
router.post("/:id/request-memo", asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where:
      req.user.role === "OPERATOR"
        ? { id: req.params.id }
        : { id: req.params.id, clientId: req.user.id }
  });
  if (!deal) return sendError(res, 404, "Deal not found");

  const contactName = normalizeString(req.body.contactName);
  const email = normalizeString(req.body.email);
  const timeline = normalizeString(req.body.timeline);
  const goals = normalizeString(req.body.goals);

  if (!contactName || !email || !goals) {
    return sendError(res, 400, "Contact name, email, and memo scope are required");
  }

  if (!isValidEmail(email)) {
    return sendError(res, 400, "Enter a valid email address");
  }

  const updated = await prisma.deal.update({
    where: { id: deal.id },
    data: { status: "DIAGNOSING" },
    include: { signals: true, timeline: true }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "MEMO_REQUESTED",
      detail: `Memo requested by ${contactName} <${email}>${timeline ? ` | Timeline: ${timeline}` : ""} | Scope: ${goals}`
    }
  });

  res.json({
    ok: true,
    deal: serializeDeal(updated),
    nextStep: "Memo request captured. StoneBridge can now scope the paid 24-hour memo for this address."
  });
}));

router.post("/", asyncHandler(async (req, res) => {
  const normalized = normalizeAddress(req.body.address);
  if (normalized.length > MAX_ADDRESS_LENGTH) return sendError(res, 400, "Address is too long");
  const address = clampAddress(normalized);
  const timelineStage = normalizeString(req.body.timelineStage);
  const pressurePoint = normalizeString(req.body.pressurePoint);
  if (!isLikelyAddress(address)) return sendError(res, 400, "A full street address is required");

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
  // Pagination parameters with sensible defaults
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [deals, totalCount] = await Promise.all([
    prisma.deal.findMany({
      where: { clientId: req.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        signals: {
          select: {
            id: true,
            source: true,
            category: true,
            label: true,
            severity: true,
            value: true,
            url: true,
            pulledAt: true
          }
        },
        timeline: { orderBy: { createdAt: "asc" }, take: 120 }
      }
    }),
    prisma.deal.count({ where: { clientId: req.user.id } })
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

  const label = normalizeString(req.body.label);
  const url = normalizeString(req.body.url);
  const kind = normalizeString(req.body.kind || "Document");
  if (!label || !url) return sendError(res, 400, "Document label and URL are required");

  // Validate URL format and prevent SSRF attacks
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return sendError(res, 400, "Document URL must use http or https protocol");
    }
    // Block internal/private IP addresses to prevent SSRF
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '10.', '172.16.', '192.168.'];
    const hostname = parsed.hostname.toLowerCase();
    if (blockedHosts.some(blocked => hostname.includes(blocked) || hostname.startsWith(blocked))) {
      return sendError(res, 400, "Document URL cannot reference internal addresses");
    }
  } catch (error) {
    return sendError(res, 400, "Invalid document URL format");
  }

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

  const title = normalizeString(req.body.title);
  const body = normalizeString(req.body.body);
  const parentId = normalizeString(req.body.parentId) || null;
  const mentions = normalizeStringArray(req.body.mentions);
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

  const title = normalizeString(req.body.title);
  const body = normalizeString(req.body.body);
  const mentions = normalizeStringArray(req.body.mentions);
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

  const category = normalizeString(req.body.category);
  const observation = normalizeString(req.body.observation);
  const impact = normalizeString(req.body.impact);
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

  const category = normalizeString(req.body.category);
  const observation = normalizeString(req.body.observation);
  const impact = normalizeString(req.body.impact);
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

  const recommendation = normalizeString(req.body.recommendation);
  const keyRisks = normalizeStringArray(req.body.keyRisks);
  const keyPositives = normalizeStringArray(req.body.keyPositives);
  const unresolvedQuestions = normalizeStringArray(req.body.unresolvedQuestions);

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
  if (!/^https?:\/\//i.test(url)) return sendError(res, 400, "Document URL must start with http or https");

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
  const bodyOutcome = req.body?.outcome;
  const outcome = normalizeOutcome(typeof bodyOutcome === "string" ? bodyOutcome : "RENEGOTIATED");
  const note = clampNote(req.body?.note ?? "Client confirmed memo was decision-grade");
  if (!outcome) return sendError(res, 400, "Outcome must be PROCEEDED, RENEGOTIATED, or KILLED");

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
  const note = clampNote(req.body?.note ?? "Client disputed memo quality");
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

  try {
    if (!fs.existsSync(deal.memoPath)) return sendError(res, 404, "Memo file missing");
    res.download(deal.memoPath, `${deal.id}.pdf`, (err) => {
      if (err) {
        console.error("[memo-download] Error downloading file:", err);
        if (!res.headersSent) {
          return sendError(res, 500, "Error downloading memo file");
        }
      }
    });
  } catch (error) {
    console.error("[memo-download] Unexpected error:", error);
    return sendError(res, 500, "Error accessing memo file");
  }
}));

/** GET /deals/:id/spatial-context - Export GeoJSON spatial context for mapping */
router.get("/:id/spatial-context", asyncHandler(async (req, res) => {
  const { getSpatialContext } = require("../services/spatialRisk");

  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  if (!deal.latitude || !deal.longitude) {
    return sendError(res, 400, "Deal has no coordinates. Run diagnostic first.");
  }

  const radiusMeters = parseInt(req.query.radius) || 500;
  const geojson = await getSpatialContext(deal.latitude, deal.longitude, radiusMeters);

  res.setHeader('Content-Type', 'application/geo+json');
  res.json(geojson);
}));

/** GET /deals/:id/spatial-risk - Get spatial risk analysis for a deal */
router.get("/:id/spatial-risk", asyncHandler(async (req, res) => {
  const { computeSpatialRisk } = require("../services/spatialRisk");

  const deal = await getAuthorizedDealForUser(req.user, req.params.id);
  if (!deal) return sendError(res, 404, "Deal not found");

  if (!deal.latitude || !deal.longitude) {
    return sendError(res, 400, "Deal has no coordinates. Run diagnostic first.");
  }

  const spatialRisk = await computeSpatialRisk(deal.latitude, deal.longitude);

  res.json({
    dealId: deal.id,
    address: deal.address,
    coordinates: {
      latitude: deal.latitude,
      longitude: deal.longitude
    },
    ...spatialRisk
  });
}));

module.exports = router;
