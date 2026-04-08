const express = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { diagnose, riskBandLabel } = require("../engine/diagnose");
const { normalizeAddress, isLikelyAddress } = require("../engine/signals/common");
const { clampAddress, MAX_ADDRESS_LENGTH } = require("../lib/validation");

const router = express.Router();

router.get("/track-record", asyncHandler(async (_req, res) => {
  const deals = await prisma.deal.findMany({
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
      amountCents: true
    }
  });
  res.json({
    stats: {
      totalMemos: deals.length,
      verdictAccuracy: deals.length ? Math.round((deals.filter(deal => !!deal.outcomeNote).length / deals.length) * 100) : 0,
      totalRiskExposureDiagnosed: `$${(deals.reduce((sum, deal) => sum + deal.amountCents, 0) * 30).toLocaleString()}`
    },
    deals: deals.map(deal => ({
      ...deal,
      address: deal.address.replace(/\d{1,4}/, "####")
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
    sourceStatus: diagnostic.sourceStatus
  });
}));

module.exports = router;
