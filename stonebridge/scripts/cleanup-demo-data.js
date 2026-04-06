const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const demoEmails = [
    "amira@harborcap.com",
    "jonah@rowhousefund.com",
    "talia@monumentlending.com"
  ];
  const demoMemoPrefixes = ["seeded-", "prod-demo-"];
  const demoPaymentPrefixes = ["pi_seed_", "pi_demo_"];

  const demoUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true, email: true }
  });

  const demoUserIds = demoUsers.map((user) => user.id);
  const demoDeals = await prisma.deal.findMany({
    where: {
      OR: [
        { clientId: { in: demoUserIds.length ? demoUserIds : ["__none__"] } },
        ...demoMemoPrefixes.map((prefix) => ({ memoHash: { startsWith: prefix } })),
        ...demoPaymentPrefixes.map((prefix) => ({ paymentIntentId: { startsWith: prefix } }))
      ]
    },
    select: { id: true }
  });

  const demoDealIds = demoDeals.map((deal) => deal.id);

  if (demoDealIds.length) {
    await prisma.timelineEvent.deleteMany({ where: { dealId: { in: demoDealIds } } });
    await prisma.signal.deleteMany({ where: { dealId: { in: demoDealIds } } });
    await prisma.dealNote.deleteMany({ where: { dealId: { in: demoDealIds } } });
    await prisma.dealDocument.deleteMany({ where: { dealId: { in: demoDealIds } } });
    await prisma.dealMarketFriction.deleteMany({ where: { dealId: { in: demoDealIds } } });
    await prisma.dealDecisionSummary.deleteMany({ where: { dealId: { in: demoDealIds } } });
    await prisma.deal.deleteMany({ where: { id: { in: demoDealIds } } });
  }

  await prisma.investorInquiry.deleteMany({
    where: {
      OR: [
        { accessCode: { startsWith: "seed-room-" } },
        { email: { in: ["maya@northpointfo.com", "jordan@aggregatorcapital.com"] } }
      ]
    }
  });

  await prisma.sponsorOpportunity.deleteMany({
    where: { workspace: { slug: "stonebridge-capital" } }
  });
  await prisma.sponsorWorkspace.deleteMany({
    where: { slug: "stonebridge-capital" }
  });

  if (demoUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
  }

  console.log(`Removed ${demoUsers.length} demo users and ${demoDeals.length} demo deals.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
