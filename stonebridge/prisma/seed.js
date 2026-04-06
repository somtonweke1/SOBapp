const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function sampleSignals(sourceSet) {
  return sourceSet.map((item, index) => ({
    source: item.source,
    category: item.category,
    label: item.label,
    value: item.value,
    severity: item.severity,
    url: item.url,
    pulledAt: daysAgo(50 - index)
  }));
}

async function main() {
  const includeSampleData = process.env.SEED_SAMPLE_DATA === "true";

  await prisma.sponsorOpportunity.deleteMany();
  await prisma.sponsorWorkspace.deleteMany();
  await prisma.investorInquiry.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);
  const operator = await prisma.user.create({
    data: {
      email: "operator@stonebridge.ai",
      password,
      role: "OPERATOR",
      name: "StoneBridge Operator"
    }
  });

  if (!includeSampleData) {
    console.log(`Seed complete. Operator only: ${operator.email} / password123`);
    return;
  }

  const clients = await Promise.all([
    prisma.user.create({ data: { email: "amira@harborcap.com", password, role: "CLIENT", name: "Amira Cole" } }),
    prisma.user.create({ data: { email: "jonah@rowhousefund.com", password, role: "CLIENT", name: "Jonah Price" } }),
    prisma.user.create({ data: { email: "talia@monumentlending.com", password, role: "CLIENT", name: "Talia Brooks" } })
  ]);

  const workspace = await prisma.sponsorWorkspace.create({
    data: {
      name: "StoneBridge Capital",
      slug: "stonebridge-capital",
      strapline: "Investor-facing operating system for real estate sponsors.",
      overview: "StoneBridge helps sponsors package track record, manage live opportunities, qualify investor demand, and run private diligence rooms from one operating layer.",
      fundName: "Sponsor Opportunity Pipeline",
      targetRaise: "Flexible",
      targetProfile: "Sponsors, investor relations teams, family offices, capital aggregators, and capital partners evaluating live opportunities.",
      geographies: ["Sunbelt", "Mid-Atlantic", "Growth markets"],
      thesis: [
        "Turn sponsor credibility into a cleaner capital formation workflow.",
        "Package live opportunities into structured investor-facing briefs.",
        "Qualify fit and selectively grant deeper room access without spreadsheet sprawl."
      ],
      metrics: [
        { label: "Track records packaged", value: "12" },
        { label: "Qualified investor conversations", value: "148" },
        { label: "Private rooms opened", value: "43" },
        { label: "Operator response target", value: "<24h" }
      ],
      trackRecord: [
        {
          title: "Sponsor Rollup One",
          market: "Phoenix, AZ",
          assetType: "Industrial outdoor storage",
          summary: "Operator packaged a fragmented pipeline into one sponsor-facing review surface for capital partners.",
          outcome: "Proceed",
          exitValue: "$21.3M",
          investorResult: "17.8% realized"
        },
        {
          title: "Flex Conversion Program",
          market: "Raleigh, NC",
          assetType: "Office / Flex",
          summary: "Capital partners reviewed deal sequencing, market notes, and sponsor rationale in a unified room flow.",
          outcome: "Proceed",
          exitValue: "$16.9M",
          investorResult: "18.6% realized"
        }
      ],
      faqs: [
        {
          question: "Who is StoneBridge for?",
          answer: "Real estate sponsors and capital teams who need a cleaner way to present opportunities and qualify investor demand."
        },
        {
          question: "What does the product replace?",
          answer: "Ad hoc PDFs, fragmented decks, spreadsheet lead tracking, and one-off diligence email chains."
        },
        {
          question: "What unlocks a private room?",
          answer: "Operator qualification and explicit room access on an inquiry tied to a live opportunity."
        }
      ]
    }
  });

  await prisma.sponsorOpportunity.createMany({
    data: [
      {
        workspaceId: workspace.id,
        slug: "sunbelt-storage-program",
        title: "Sunbelt Storage Program",
        market: "Texas / Florida",
        assetType: "Self-storage",
        stage: "Capital formation",
        targetEquity: "$12M",
        targetHold: "30-36 months",
        summary: "Portfolio-style self-storage deployment packaged for sponsor and allocator review.",
        thesis: [
          "Focus on demand-dense corridors with constrained competing supply.",
          "Use one sponsor narrative across multiple sites to speed investor comprehension.",
          "Keep diligence path simple while preserving project-level context."
        ],
        diligence: [
          "Pipeline sequencing mapped against entitlement timing.",
          "Demand underwriting framed for conservative assumptions.",
          "Operator notes translated into investor-readable briefs."
        ],
        roomNotes: [
          "Project queue and site control notes.",
          "Capital stack and partner economics framing.",
          "Market demand rationale and sequencing checkpoints."
        ]
      },
      {
        workspaceId: workspace.id,
        slug: "small-bay-flex-portfolio",
        title: "Small-Bay Flex Portfolio",
        market: "Southeast U.S.",
        assetType: "Office / Industrial Flex",
        stage: "Partner review",
        targetEquity: "$9M",
        targetHold: "24-30 months",
        summary: "Small-bay flex opportunity room designed for partners evaluating phased deployment and sponsor communication quality.",
        thesis: [
          "Capture small-bay demand with simple room-based investor review.",
          "Reduce sponsor friction in follow-up and diligence management.",
          "Track investor engagement at the opportunity level."
        ],
        diligence: [
          "Market and tenant profile framed in one brief.",
          "Execution timing and downside sensitivities summarized.",
          "Partner-facing operating notes prepared for room access."
        ],
        roomNotes: [
          "Deployment pacing and market notes.",
          "Execution plan and reporting structure.",
          "Partner update cadence and diligence checklist."
        ]
      }
    ]
  });

  const completedDeals = [
    ["1401 Hull St, Baltimore, MD 21230", clients[0], "PROCEED", "Deal proceeded on original schedule", 31, 12, 4, 2],
    ["2207 E Baltimore St, Baltimore, MD 21231", clients[1], "PROCEED", "Deal proceeded after routine lender diligence", 28, 14, 3, 2],
    ["3300 Clifton Ave, Baltimore, MD 21216", clients[2], "PROCEED", "Deal proceeded with modest reserve add", 34, 18, 4, 3],
    ["509 S Milton Ave, Baltimore, MD 21224", clients[0], "PROCEED", "Deal proceeded and rehab started", 22, 10, 2, 1],
    ["1501 E Monument St, Baltimore, MD 21205", clients[1], "CAUTION", "Deal renegotiated after title and tax issues surfaced", 58, 48, 8, 6],
    ["1728 W North Ave, Baltimore, MD 21217", clients[2], "CAUTION", "Deal renegotiated with seller credit and holdback", 61, 46, 9, 6],
    ["913 W Lombard St, Baltimore, MD 21223", clients[0], "CAUTION", "Deal renegotiated before committee sign-off", 52, 43, 7, 5],
    ["540 N Carey St, Baltimore, MD 21223", clients[1], "ESCALATE", "Deal killed before earnest money went hard", 88, 92, 15, 11]
  ];

  for (let index = 0; index < completedDeals.length; index += 1) {
    const [address, client, verdict, outcomeNote, before, after, flagsBefore, flagsAfter] = completedDeals[index];
    await prisma.deal.create({
      data: {
        address,
        clientId: client.id,
        status: "COMPLETED",
        verdict,
        riskScoreBefore: before,
        riskScoreAfter: after,
        flagCountBefore: flagsBefore,
        flagCountAfter: flagsAfter,
        signalSources: ["Baltimore City Open Data", "Maryland SDAT", "Baltimore 311"],
        memoPath: `memos/completed-${index + 1}.pdf`,
        memoHash: `seeded-hash-${index + 1}`,
        memoDeliveredAt: daysAgo(65 - index * 2),
        outcomeConfirmedAt: daysAgo(35 - index),
        outcomeNote,
        paymentIntentId: `pi_seed_completed_${index + 1}`,
        paymentStatus: "RELEASED",
        amountCents: 250000,
        signals: {
          create: sampleSignals([
            { source: "Baltimore City Open Data", category: "PROPERTY_DISTRESS", label: "Permit and code pattern", value: "Historic permit lag and open file activity", severity: verdict === "ESCALATE" ? "HIGH" : "MEDIUM", url: "https://data.baltimorecity.gov" },
            { source: "Maryland SDAT", category: "OWNERSHIP", label: "Ownership chain review", value: "Recent transfer or LLC stacking reviewed", severity: verdict === "PROCEED" ? "LOW" : "MEDIUM", url: "https://sdat.dat.maryland.gov" },
            { source: "Baltimore 311", category: "UTILITY", label: "Service complaint cluster", value: "Localized utility friction around parcel", severity: verdict === "ESCALATE" ? "CRITICAL" : "MEDIUM", url: "https://data.baltimorecity.gov" }
          ])
        },
        timeline: {
          create: [
            { event: "DEAL_SUBMITTED", detail: "Seeded intake" },
            { event: "DIAGNOSTIC_COMPLETED", detail: `Risk score ${before}` },
            { event: "VERDICT_SET", detail: `Verdict ${verdict}` },
            { event: "MEMO_DELIVERED", detail: "StoneBridge AI — Deal Risk Memo", hash: `seeded-hash-${index + 1}` },
            { event: "OUTCOME_CONFIRMED", detail: outcomeNote }
          ]
        }
      }
    });
  }

  const inProgressDeals = [
    ["415 N Milton Ave, Baltimore, MD 21224", clients[2], "CAUTION", 78, 11, "Memo delivered. Outcome window open."],
    ["1209 N Caroline St, Baltimore, MD 21213", clients[1], "ESCALATE", 85, 14, "Memo delivered. Waiting on client outcome."]
  ];

  for (let index = 0; index < inProgressDeals.length; index += 1) {
    const [address, client, verdict, before, flags, note] = inProgressDeals[index];
    await prisma.deal.create({
      data: {
        address,
        clientId: client.id,
        status: "OUTCOME_WINDOW",
        verdict,
        riskScoreBefore: before,
        flagCountBefore: flags,
        signalSources: ["Baltimore City Open Data", "Maryland SDAT", "SAM.gov", "eMMA"],
        memoPath: `memos/in-progress-${index + 1}.pdf`,
        memoHash: `seeded-progress-hash-${index + 1}`,
        memoDeliveredAt: daysAgo(12 + index * 4),
        outcomeNote: note,
        paymentIntentId: `pi_seed_progress_${index + 1}`,
        paymentStatus: "HELD",
        signals: {
          create: sampleSignals([
            { source: "Baltimore City Open Data", category: "PROPERTY_DISTRESS", label: "Vacancy or permit pressure", value: "Open parcel friction detected", severity: "HIGH", url: "https://data.baltimorecity.gov" },
            { source: "Maryland SDAT", category: "LIEN", label: "Title and lien context", value: "Tax or lien pressure unresolved", severity: verdict === "ESCALATE" ? "CRITICAL" : "HIGH", url: "https://sdat.dat.maryland.gov" },
            { source: "SAM.gov", category: "PROCUREMENT", label: "Vendor adjacency review", value: "ZIP-level contractor integrity pattern", severity: "MEDIUM", url: "https://sam.gov" }
          ])
        },
        timeline: {
          create: [
            { event: "DEAL_SUBMITTED", detail: "Seeded intake" },
            { event: "DIAGNOSTIC_COMPLETED", detail: `Risk score ${before}` },
            { event: "VERDICT_SET", detail: `Verdict ${verdict}` },
            { event: "MEMO_DELIVERED", detail: "StoneBridge AI — Deal Risk Memo", hash: `seeded-progress-hash-${index + 1}` }
          ]
        }
      }
    });
  }

  await prisma.deal.create({
    data: {
      address: "2317 E Fayette St, Baltimore, MD 21224",
      clientId: clients[0].id,
      status: "PENDING",
      riskScoreBefore: 67,
      flagCountBefore: 10,
      verdict: "CAUTION",
      signalSources: ["Baltimore City Open Data", "Maryland SDAT", "Baltimore 311"],
      paymentIntentId: "pi_seed_pending_1",
      paymentStatus: "HELD",
      signals: {
        create: sampleSignals([
          { source: "Baltimore City Open Data", category: "PROPERTY_DISTRESS", label: "Permit mismatch", value: "Permit file does not match seller representation", severity: "HIGH", url: "https://data.baltimorecity.gov" },
          { source: "Maryland SDAT", category: "OWNERSHIP", label: "Ownership turnover", value: "Recent transfer through low-substance LLC", severity: "MEDIUM", url: "https://sdat.dat.maryland.gov" }
        ])
      },
      timeline: {
        create: [
          { event: "DEAL_SUBMITTED", detail: "Pending operator review" },
          { event: "DIAGNOSTIC_COMPLETED", detail: "Initial diagnostic run complete" }
        ]
      }
    }
  });

  await prisma.investorInquiry.createMany({
    data: [
      {
        name: "Maya Levin",
        email: "maya@northpointfo.com",
        firm: "Northpoint Family Office",
        investorType: "Family Office",
        checkSize: "$1M+",
        interestLevel: "Ready for sponsor call",
        accredited: true,
        targetMarkets: ["Texas", "Self-storage"],
        workspaceId: workspace.id,
        opportunityId: (await prisma.sponsorOpportunity.findUnique({ where: { slug: "sunbelt-storage-program" } })).id,
        timeline: "Within 2 weeks",
        message: "Interested in current pipeline sequencing and partner economics.",
        status: "ROOM_GRANTED",
        roomAccessGranted: true,
        accessCode: "seed-room-dfw-001"
      },
      {
        name: "Jordan Hale",
        email: "jordan@aggregatorcapital.com",
        firm: "Aggregator Capital",
        investorType: "Capital Aggregator",
        checkSize: "$500k - $1M",
        interestLevel: "Exploring partner economics",
        accredited: true,
        targetMarkets: ["Florida", "Flex"],
        workspaceId: workspace.id,
        opportunityId: (await prisma.sponsorOpportunity.findUnique({ where: { slug: "small-bay-flex-portfolio" } })).id,
        timeline: "This quarter",
        message: "Looking for a sponsor with cleaner investor reporting and direct terms.",
        status: "QUALIFIED",
        roomAccessGranted: false,
        accessCode: "seed-room-fl-002"
      }
    ]
  });

  console.log(`Seed complete. Operator: ${operator.email} / password123`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
