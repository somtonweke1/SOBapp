const express = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { diagnose, riskBandLabel } = require("../engine/diagnose");
const { normalizeAddress, isLikelyAddress } = require("../engine/signals/common");
const { clampAddress, MAX_ADDRESS_LENGTH } = require("../lib/validation");
const { isDemoDeal } = require("../lib/deal-demo");

/** Read-only JSON used by the marketing site and public preview helpers. */
const router = express.Router();

/** Public aggregate of completed deals for the marketing track record (demo rows excluded). */
router.get("/track-record", asyncHandler(async (_req, res) => {
  const rawDeals = await prisma.deal.findMany({
    where: { status: "COMPLETED" },
    orderBy: { outcomeConfirmedAt: "desc" },
    select: {
      id: true,
      address: true,
      verdict: true,
      outcomeNote: true,
      memoDeliveredAt: true,
      outcomeConfirmedAt: true,
      riskScoreBefore: true,
      riskScoreAfter: true,
      amountCents: true,
      memoHash: true,
      paymentIntentId: true
    }
  });
  const deals = rawDeals.filter((deal) => !isDemoDeal(deal));
  const totalMemoValueCents = deals.reduce((sum, deal) => sum + (deal.amountCents || 0), 0);
  res.json({
    stats: {
      totalMemos: deals.length,
      verdictAccuracy: deals.length
        ? Math.round((deals.filter((deal) => Boolean(deal.outcomeNote)).length / deals.length) * 100)
        : 0,
      totalRiskExposureDiagnosed: `$${Math.round(totalMemoValueCents / 100).toLocaleString()}`
    },
    deals: deals.map((deal) => ({
      id: deal.id,
      address: deal.address.replace(/\d{1,4}/, "####"),
      verdict: deal.verdict,
      hasOutcomeNote: Boolean(deal.outcomeNote),
      memoDeliveredAt: deal.memoDeliveredAt,
      outcomeConfirmedAt: deal.outcomeConfirmedAt,
      riskScoreBefore: deal.riskScoreBefore,
      riskScoreAfter: deal.riskScoreAfter,
      amountCents: deal.amountCents
    }))
  });
}));

router.get("/preview/:address", asyncHandler(async (req, res) => {
  const raw = decodeURIComponent(req.params.address || "");
  const normalized = normalizeAddress(raw);
  if (normalized.length > MAX_ADDRESS_LENGTH) {
    return sendError(res, 400, "Address parameter exceeds maximum length");
  }
  const address = clampAddress(normalized);
  if (!address || address.length < 10) {
    return sendError(res, 400, "Address parameter is missing or too short");
  }
  if (!isLikelyAddress(address)) {
    return sendError(res, 400, "Address must include a street number and street type (e.g. St, Ave)");
  }
  const diagnostic = await diagnose(address);
  res.json({
    address,
    topSignals: diagnostic.signals.slice(0, 3),
    blurredRiskBand: riskBandLabel(diagnostic.riskScore),
    sourceStatus: diagnostic.sourceStatus,
    dataQuality: diagnostic.dataQuality
  });
}));

module.exports = router;
