const cron = require("node-cron");
const { prisma } = require("../lib/prisma");
const { captureIntent } = require("../lib/payments");

function thirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
}

function startJobs() {
  cron.schedule("0 6 * * *", async () => {
    const deals = await prisma.deal.findMany({
      where: {
        status: { in: ["MEMO_DELIVERED", "OUTCOME_WINDOW"] },
        paymentStatus: "HELD",
        memoDeliveredAt: { lte: thirtyDaysAgo() },
        paymentIntentId: { not: null }
      }
    });

    for (const deal of deals) {
      try {
        await captureIntent(deal.paymentIntentId);
        await prisma.deal.update({
          where: { id: deal.id },
          data: {
            status: "COMPLETED",
            paymentStatus: "RELEASED",
            outcomeConfirmedAt: new Date(),
            outcomeNote: deal.outcomeNote || "Auto-captured after 30-day confirmation window"
          }
        });
        await prisma.timelineEvent.create({
          data: {
            dealId: deal.id,
            event: "PAYMENT_AUTO_CAPTURED",
            detail: "30-day outcome window expired; payment captured automatically"
          }
        });
      } catch (error) {
        await prisma.timelineEvent.create({
          data: {
            dealId: deal.id,
            event: "AUTO_CAPTURE_FAILED",
            detail: error.message
          }
        });
      }
    }
  });
}

module.exports = { startJobs, thirtyDaysAgo };
