const express = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler } = require("../lib/http");
const { diagnose } = require("../engine/diagnose");

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
  const address = decodeURIComponent(req.params.address);
  const diagnostic = await diagnose(address);
  res.json({
    address,
    topSignals: diagnostic.signals.slice(0, 3),
    blurredRiskBand: diagnostic.riskScore >= 65 ? "High risk band" : diagnostic.riskScore >= 35 ? "Moderate risk band" : "Lower risk band"
  });
}));

module.exports = router;
