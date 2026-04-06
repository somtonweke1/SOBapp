const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const demoEmails = [
    "amira@harborcap.com",
    "jonah@rowhousefund.com",
    "talia@monumentlending.com"
  ];

  const demoUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true, email: true }
  });

  const demoUserIds = demoUsers.map((user) => user.id);
  const demoDeals = await prisma.deal.findMany({
    where: {
      OR: [
        { clientId: { in: demoUserIds.length ? demoUserIds : ["__none__"] } },
        { memoHash: { startsWith: "seeded-" } },
        { paymentIntentId: { startsWith: "pi_seed_" } }
      ]
    },
    select: { id: true }
  });

  const demoDealIds = demoDeals.map((deal) => deal.id);

  await prisma.$transaction(async (tx) => {
    if (demoDealIds.length) {
      await tx.timelineEvent.deleteMany({ where: { dealId: { in: demoDealIds } } });
      await tx.signal.deleteMany({ where: { dealId: { in: demoDealIds } } });
      await tx.dealNote.deleteMany({ where: { dealId: { in: demoDealIds } } });
      await tx.dealDocument.deleteMany({ where: { dealId: { in: demoDealIds } } });
      await tx.dealMarketFriction.deleteMany({ where: { dealId: { in: demoDealIds } } });
      await tx.dealDecisionSummary.deleteMany({ where: { dealId: { in: demoDealIds } } });
      await tx.deal.deleteMany({ where: { id: { in: demoDealIds } } });
    }

    await tx.investorInquiry.deleteMany({
      where: {
        OR: [
          { accessCode: { startsWith: "seed-room-" } },
          { email: { in: ["maya@northpointfo.com", "jordan@aggregatorcapital.com"] } }
        ]
      }
    });

    await tx.sponsorOpportunity.deleteMany({
      where: { workspace: { slug: "stonebridge-capital" } }
    });
    await tx.sponsorWorkspace.deleteMany({
      where: { slug: "stonebridge-capital" }
    });

    if (demoUserIds.length) {
      await tx.user.deleteMany({ where: { id: { in: demoUserIds } } });
    }
  });

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
