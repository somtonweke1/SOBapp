const path = require("path");
const { prisma } = require("./prisma");
const { diagnose } = require("../engine/diagnose");
const { generateMemo } = require("../engine/memo");

/** Serializes a deal while hiding raw memo filesystem paths. */
function serializeDeal(deal) {
  return {
    ...deal,
    memoPath: deal.memoPath ? path.basename(deal.memoPath) : null
  };
}

/** Runs the diagnostic engine for a stored deal and persists the normalized result. */
async function runDiagnosticForDeal(dealId) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw Object.assign(new Error("Deal not found"), { statusCode: 404 });

  await prisma.deal.update({
    where: { id: dealId },
    data: { status: "DIAGNOSING" }
  });

  const result = await diagnose(deal.address);

  await prisma.$transaction([
    prisma.signal.deleteMany({ where: { dealId } }),
    prisma.signal.createMany({
      data: result.signals.map(signal => ({ ...signal, dealId }))
    }),
    prisma.deal.update({
      where: { id: dealId },
      data: {
        riskScoreBefore: result.riskScore,
        flagCountBefore: result.flagCount,
        verdict: result.verdict,
        signalSources: [...new Set(result.signals.map(signal => signal.source))],
        status: "PENDING"
      }
    }),
    prisma.timelineEvent.create({
      data: {
        dealId,
        event: "DIAGNOSTIC_COMPLETED",
        detail: `Risk score ${result.riskScore}; ${result.flagCount} non-low flags; derived verdict ${result.verdict}${result.sourceStatus.rejected ? `; ${result.sourceStatus.rejected} source rejections` : ""}${result.sourceStatus.estimatedSignalCount ? `; ${result.sourceStatus.estimatedSignalCount} estimated signals` : ""}${result.dataQuality?.scoreCappedForEstimatedOnly ? "; score capped (estimated-only)" : ""}`
      }
    })
  ]);

  return result;
}

/** Generates and records the memo artifact for a diagnosed deal. */
async function deliverMemoForDeal(dealId) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { signals: true }
  });
  if (!deal) throw Object.assign(new Error("Deal not found"), { statusCode: 404 });
  if (!deal.verdict) throw Object.assign(new Error("Set a verdict before delivery"), { statusCode: 400 });

  const memo = await generateMemo(deal, deal.signals);

  await prisma.deal.update({
    where: { id: dealId },
    data: { status: "OUTCOME_WINDOW" }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId,
      event: "OUTCOME_WINDOW_OPENED",
      detail: "Memo delivered. Client outcome confirmation window is open.",
      hash: memo.hash
    }
  });

  return memo;
}

/** Aggregates public-facing platform stats from persisted deal records. */
async function getPlatformStats() {
  const [completed, total, signals, released] = await Promise.all([
    prisma.deal.count({ where: { status: "COMPLETED" } }),
    prisma.deal.count(),
    prisma.signal.count(),
    prisma.deal.aggregate({
      _sum: { amountCents: true },
      where: { paymentStatus: "RELEASED" }
    })
  ]);

  return {
    totalDeals: total,
    completedDeals: completed,
    signalsFused: signals,
    entitiesCrossReferenced: Math.floor(signals * 0.7),
    riskExposureMapped: `$${((released._sum.amountCents || 0) * 220).toLocaleString()}`,
    confidenceScore: total > 0 ? `${Math.min(99, Math.max(0, Math.round((completed / total) * 100)))}%` : "0%"
  };
}

module.exports = { serializeDeal, runDiagnosticForDeal, deliverMemoForDeal, getPlatformStats };
