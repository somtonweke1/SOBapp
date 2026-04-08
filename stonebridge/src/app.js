const express = require("express");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const { prisma } = require("./lib/prisma");
const { config } = require("./lib/config");
const { renderTemplate, escapeHtml } = require("./lib/template");
const { loadSessionUser, hideDemoPublicUser } = require("./lib/request-user");
const authRoutes = require("./routes/auth");
const dealRoutes = require("./routes/deals");
const operatorRoutes = require("./routes/operator");
const paymentRoutes = require("./routes/payments");
const publicRoutes = require("./routes/public");
const sponsorRoutes = require("./routes/sponsor");
const { listActiveWorkspaces } = require("./lib/sponsor");
const { SITE_DESCRIPTION, SITE_TITLE } = require("./lib/site");
const { analyzeDistributionDiagnostic, normalizeList } = require("./lib/distribution-diagnostic");
const { isDemoDeal } = require("./lib/deal-demo");
const { startJobs } = require("./jobs");

const app = express();
const publicPath = path.resolve(__dirname, "..", "public");
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.path.startsWith("/css/") || req.path.startsWith("/js/")) {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  }
  next();
});
app.use(express.static(publicPath));
app.use("/memos", express.static(path.resolve(__dirname, "..", "memos")));

/** Resolves the authenticated user for HTML pages and suppresses seeded demo identities. */
async function getCurrentUser(req) {
  const user = await loadSessionUser(req, { includeWorkspaces: true });
  return hideDemoPublicUser(user);
}

/** Merges global page metadata with route-specific view data. */
function buildPageData(base = {}) {
  const assetVersion =
    process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.GITHUB_SHA?.slice(0, 12) ||
    "dev";
  return {
    brand: "STONEBRIDGE AI",
    nav: "",
    pageScript: "",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    assetVersion,
    ...base
  };
}

/** Formats the nav auth state for guests, operators, and clients. */
function formatAuthState(user, fallback = "Login") {
  if (!user) return fallback;
  if (user.email === "guest@stonebridge.ai") return "Preview session";
  if (user.role === "OPERATOR") return `${user.name || user.email} · Operator`;
  return user.name || user.email;
}

/** Formats a memo delivery duration into a compact hour string. */
function formatAvgDeliveryHours(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${Math.round(value)}h`;
}

/** Marks a checkbox input as checked when its value is present. */
function isChecked(list, value) {
  return list.includes(value) ? "checked" : "";
}

/** Marks a select option as selected when it matches the current value. */
function isSelected(actual, expected) {
  return actual === expected ? "selected" : "";
}

/** Renders the standalone distribution diagnostic result block. */
function renderDistributionDiagnosticResult(input, result) {
  if (!result) return "";

  const diagnosisHtml = result.diagnosis.map((item) => `
    <article class="diagnostic-panel">
      <div class="eyebrow">${item.title}</div>
      <div class="card-copy">${item.body}</div>
    </article>
  `).join("");

  const actionsHtml = result.nextActions.map((item) => `
    <div class="diagnostic-list-item">${item}</div>
  `).join("");

  return `
    <section class="page-section diagnostic-band">
      <div class="container">
        <div class="section-head">
          <div class="eyebrow">Diagnostic Output</div>
          <h2 class="section-title">${input.fundName || "Fund"} needs a clearer ${result.primaryConstraint.toLowerCase()} path.</h2>
          <p class="subcopy">This output is generated from the intake you provided. It is meant to tell you what to fix first before adding more fundraising conversations.</p>
        </div>

        <div class="diagnostic-summary">
          <div class="diagnostic-score-card">
            <div class="eyebrow">Distribution readiness score</div>
            <div class="diagnostic-score">${result.readinessScore}</div>
            <div class="diagnostic-band-label">${result.readinessBand} readiness</div>
            <div class="proof-block" style="margin-top:18px">
              <div><span class="pk">primary_constraint</span><span class="pv">${result.primaryConstraint}</span></div>
              <div><span class="pk">recommended_track</span><span class="pv">${result.trackRecommendation}</span></div>
              <div><span class="pk">partner_model</span><span class="pv">${input.partnerModel || "Not specified"}</span></div>
            </div>
          </div>

          <aside class="diagnostic-panel">
            <div class="eyebrow">Recommended next move</div>
            <div class="card-title">${result.trackRecommendation}</div>
            <div class="card-copy">Use this track if the goal is to make the offer easier for the right capital partners to understand, trust, and place.</div>
          </aside>
        </div>

        <div class="diagnostic-grid">
          ${diagnosisHtml}
        </div>

        <div class="diagnostic-panel" style="margin-top:24px">
          <div class="eyebrow">Immediate next actions</div>
          <div class="diagnostic-list">${actionsHtml}</div>
          <div class="action-row">
            <a class="btn btn-primary" href="mailto:somton@jhu.edu?subject=Distribution%20Partner%20Diagnostic%20Follow-Up">Discuss this diagnostic</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

/** Detects whether a deal has advanced into the paid memo lifecycle. */
function isPaidMemoDeal(deal) {
  return Boolean(
    deal?.memoDeliveredAt ||
    deal?.paymentStatus === "HELD" ||
    deal?.paymentStatus === "RELEASED" ||
    deal?.status === "MEMO_DELIVERED" ||
    deal?.status === "OUTCOME_WINDOW" ||
    deal?.status === "COMPLETED"
  );
}

app.get("/healthz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      ok: true,
      service: "stonebridge-web",
      database: "reachable",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      service: "stonebridge-web",
      database: "unreachable",
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/", async (req, res, next) => {
  try {
    const user = await getCurrentUser(req);
    const allDeals = await prisma.deal.findMany({
      select: {
        amountCents: true,
        createdAt: true,
        memoDeliveredAt: true,
        memoHash: true,
        paymentStatus: true,
        paymentIntentId: true,
        riskScoreBefore: true,
        status: true
      }
    });
    const realDeals = allDeals.filter((deal) => !isDemoDeal(deal));
    const memoDeals = realDeals.filter(isPaidMemoDeal);
    const completed = realDeals.filter((deal) => deal.status === "COMPLETED").length;
    const avgRiskScore = realDeals.length
      ? realDeals.reduce((sum, deal) => sum + (deal.riskScoreBefore || 0), 0) / realDeals.length
      : 0;
    const averageDeliveryHours = memoDeals.length
      ? memoDeals.reduce((sum, deal) => {
        const deliveredAt = deal.memoDeliveredAt ? new Date(deal.memoDeliveredAt).getTime() : new Date(deal.createdAt).getTime();
        const createdAt = new Date(deal.createdAt).getTime();
        return sum + Math.max(0, (deliveredAt - createdAt) / 36e5);
      }, 0) / memoDeals.length
      : 0;
    const riskExposure = Math.round(memoDeals.reduce((sum, deal) => sum + (deal.amountCents || 0), 0) / 100000);
    const html = renderTemplate("landing", buildPageData({
      title: SITE_TITLE,
      authState: formatAuthState(user, "Login"),
      userJson: JSON.stringify(user || null),
      totalMemos: memoDeals.length,
      totalDeals: completed,
      riskExposure,
      avgDelivery: formatAvgDeliveryHours(averageDeliveryHours),
      avgRiskScore: Math.round(avgRiskScore || 0)
    }));
    res.send(html);
  } catch (error) {
    next(error);
  }
});

app.get("/preview", async (req, res) => {
  const user = await getCurrentUser(req);
  res.send(renderTemplate("preview", buildPageData({
    title: `${SITE_TITLE} | Preview`,
    authState: formatAuthState(user, "Login"),
    userJson: JSON.stringify(user || null)
  })));
});

app.get("/capital", async (req, res) => {
  const user = await getCurrentUser(req);
  const workspaces = await listActiveWorkspaces();
  if (user?.ownedWorkspaces?.[0]?.slug) {
    return res.redirect(`/capital/${user.ownedWorkspaces[0].slug}`);
  }
  res.send(renderTemplate("capital-directory", buildPageData({
    title: `${SITE_TITLE} | Sponsor Intelligence`,
    authState: formatAuthState(user, "Investor access"),
    userJson: JSON.stringify(user || null),
    workspacesJson: JSON.stringify(workspaces)
  })));
});

app.get("/capital/:workspaceSlug/opportunities/:slug", async (req, res) => {
  const user = await getCurrentUser(req);
  res.send(renderTemplate("opportunity", buildPageData({
    title: `${SITE_TITLE} | Opportunity Brief`,
    authState: formatAuthState(user, "Investor access"),
    userJson: JSON.stringify(user || null),
    workspaceSlug: req.params.workspaceSlug,
    slug: req.params.slug
  })));
});

app.get("/capital/:workspaceSlug/room/:slug", async (req, res) => {
  const user = await getCurrentUser(req);
  res.send(renderTemplate("room", buildPageData({
    title: `${SITE_TITLE} | Private Room`,
    authState: formatAuthState(user, "Private room"),
    userJson: JSON.stringify(user || null),
    workspaceSlug: req.params.workspaceSlug,
    slug: req.params.slug
  })));
});

app.get("/capital/:workspaceSlug", async (req, res) => {
  const user = await getCurrentUser(req);
  res.send(renderTemplate("sponsor", buildPageData({
    title: `${SITE_TITLE} | Sponsor Intelligence`,
    authState: formatAuthState(user, "Investor access"),
    userJson: JSON.stringify(user || null),
    workspaceSlug: req.params.workspaceSlug
  })));
});

app.get("/login", (req, res) => {
  res.send(renderTemplate("login", buildPageData({ title: `${SITE_TITLE} | Login` })));
});

app.get("/register", (req, res) => {
  res.send(renderTemplate("register", buildPageData({ title: `${SITE_TITLE} | Register` })));
});

/** Renders an authenticated app view with the standard page metadata. */
async function renderAuthedPage(req, res, view, extra = {}, role) {
  const user = await getCurrentUser(req);
  if (role === "OPERATOR") {
    if (!user && req.query.code !== config.operatorAccessCode) return res.redirect("/login");
    if (user && user.role !== "OPERATOR" && req.query.code !== config.operatorAccessCode) return res.status(403).send("Forbidden");
  } else {
    if (!user) return res.redirect("/login");
    if (role && user.role !== role) return res.status(403).send("Forbidden");
  }
  return res.send(renderTemplate(view, buildPageData({
    title: extra.title || SITE_TITLE,
    authState: formatAuthState(user, "Operator access code"),
    userJson: JSON.stringify(user || null),
    ...extra
  })));
}

/** Maps detailed deal statuses into list-level filter buckets. */
function getDealFilterBucket(status) {
  switch (status) {
    case "COMPLETED":
      return "COMPLETED";
    case "DIAGNOSING":
    case "MEMO_DELIVERED":
    case "OUTCOME_WINDOW":
      return "ACTIVE";
    case "PENDING":
    case "DISPUTED":
    default:
      return "PENDING";
  }
}

/** Formats payment state into client-facing commercial language. */
function formatPaymentStatus(status) {
  switch (status) {
    case "UNPAID":
      return "Preview only";
    case "HELD":
      return "$2,500 held";
    case "RELEASED":
      return "Paid";
    case "REFUNDED":
      return "Refunded";
    case "DISPUTED":
      return "Disputed";
    default:
      return status || "Unknown";
  }
}

/** Summarizes where a deal currently sits in the free-preview to paid-memo path. */
function describeCommercialState(deal) {
  if (deal.status === "COMPLETED") {
    return {
      title: "Outcome confirmed",
      description: "This memo engagement reached a confirmed outcome and the commercial cycle is complete."
    };
  }

  if (deal.paymentStatus === "RELEASED" || deal.paymentStatus === "HELD" || deal.status === "OUTCOME_WINDOW" || deal.status === "MEMO_DELIVERED") {
    return {
      title: "Paid memo in motion",
      description: "A memo has been delivered or commercial payment is already in flight for this address."
    };
  }

  if (deal.status === "DIAGNOSING") {
    return {
      title: "Memo requested",
      description: "StoneBridge has intake context for the paid memo and the deal is in operator review."
    };
  }

  return {
    title: "Free preview only",
    description: "This record is still a free screen. No paid memo has been requested or billed yet."
  };
}

app.get("/submit", async (req, res) => {
  const user = await getCurrentUser(req);
  res.send(renderTemplate("submit", buildPageData({
    title: `${SITE_TITLE} | Diagnostics`,
    stripePublishableKey: "",
    authState: formatAuthState(user, "Start free preview"),
    userJson: JSON.stringify(user || null)
  })));
});

app.get("/distribution-diagnostic", async (req, res) => {
  const user = await getCurrentUser(req);
  res.send(renderTemplate("distribution-diagnostic", buildPageData({
    title: `${SITE_TITLE} | Distribution Partner Diagnostic`,
    authState: formatAuthState(user, "Run diagnostic"),
    userJson: JSON.stringify(user || null),
    resultSection: ""
  })));
});

app.post("/distribution-diagnostic", async (req, res) => {
  const user = await getCurrentUser(req);
  const shortText = (value, max) => String(value || "").trim().slice(0, max);
  const input = {
    fundName: shortText(req.body.fundName, 200),
    assetFocus: shortText(req.body.assetFocus, 500),
    partnerModel: shortText(req.body.partnerModel, 120),
    trackRecord: shortText(req.body.trackRecord, 80),
    fundraisingGoal: shortText(req.body.fundraisingGoal, 120),
    outreachState: shortText(req.body.outreachState, 80),
    currentConstraint: shortText(req.body.currentConstraint, 80),
    targetPartners: normalizeList(req.body.targetPartners).map((item) => shortText(item, 120)),
    materials: normalizeList(req.body.materials).map((item) => shortText(item, 80)),
    notes: shortText(req.body.notes, 4000)
  };

  const result = analyzeDistributionDiagnostic(input);

  res.send(renderTemplate("distribution-diagnostic", buildPageData({
    title: `${SITE_TITLE} | Distribution Partner Diagnostic`,
    authState: formatAuthState(user, "Run diagnostic"),
    userJson: JSON.stringify(user || null),
    fundName: input.fundName,
    assetFocus: input.assetFocus,
    fundraisingGoal: input.fundraisingGoal,
    notes: input.notes,
    partnerModelFoF: isSelected(input.partnerModel, "FoF"),
    partnerModelCoGp: isSelected(input.partnerModel, "co-GP"),
    partnerModelDistribution: isSelected(input.partnerModel, "distribution partner"),
    partnerModelHybrid: isSelected(input.partnerModel, "hybrid"),
    trackRecordInstitutional: isSelected(input.trackRecord, "institutional"),
    trackRecordEmerging: isSelected(input.trackRecord, "emerging"),
    trackRecordEarly: isSelected(input.trackRecord, "early"),
    outreachStateNone: isSelected(input.outreachState, "none"),
    outreachStateTesting: isSelected(input.outreachState, "testing"),
    outreachStateActive: isSelected(input.outreachState, "active"),
    currentConstraintOffer: isSelected(input.currentConstraint, "offer"),
    currentConstraintMaterials: isSelected(input.currentConstraint, "materials"),
    currentConstraintRecruiting: isSelected(input.currentConstraint, "partner-recruiting"),
    currentConstraintConversion: isSelected(input.currentConstraint, "conversion"),
    currentConstraintDistribution: isSelected(input.currentConstraint, "distribution"),
    targetPartnerRia: isChecked(input.targetPartners, "RIA / Advisor"),
    targetPartnerAggregator: isChecked(input.targetPartners, "Capital Aggregator"),
    targetPartnerFamilyOffice: isChecked(input.targetPartners, "Family Office Network"),
    targetPartnerSyndicator: isChecked(input.targetPartners, "Syndicator"),
    targetPartnerFof: isChecked(input.targetPartners, "FoF Manager"),
    materialDeck: isChecked(input.materials, "deck"),
    materialOnePager: isChecked(input.materials, "one-pager"),
    materialFaq: isChecked(input.materials, "faq"),
    materialMemo: isChecked(input.materials, "diligence memo"),
    resultSection: renderDistributionDiagnosticResult(input, result)
  })));
});

app.get("/deals", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.redirect("/login");

  const rawDeals = await prisma.deal.findMany({
    where: { clientId: user.id },
    include: { signals: true },
    orderBy: { createdAt: "desc" }
  });
  const deals = rawDeals.filter((deal) => !isDemoDeal(deal));

  const verdictClass = (verdict) => verdict ? verdict.toLowerCase() : "pending";
  const verdictLabel = (verdict) => verdict || "PENDING";
  const titleCase = (value) => value
    ? value.charAt(0) + value.slice(1).toLowerCase()
    : "Pending";

  const dealsHtml = deals.length === 0
    ? `<div class="empty-state"><div>No diagnostics yet.</div><div>Your workspace is clean. Start with one address and turn the first useful screen into a paid memo only when the deal pressure is real.</div><div class="empty-state-action"><a href="/submit" class="btn btn-primary">Run your first preview</a></div></div>`
    : deals.map((deal) => `
      <a href="/deals/${deal.id}" class="deal-card ${verdictClass(deal.verdict)}" data-filter-status="${getDealFilterBucket(deal.status)}">
        <div class="deal-card-head">
          <div>
            <div class="deal-address">${deal.address}</div>
            <div class="deal-meta-row">
              <span class="deal-meta">${new Date(deal.createdAt).toLocaleDateString()}</span>
              <span class="deal-meta">${deal.signals.length} signals</span>
              <span class="deal-meta">${deal.status}</span>
            </div>
          </div>
          <span class="v-badge ${verdictClass(deal.verdict)}">${verdictLabel(deal.verdict)}</span>
        </div>
        <div class="triptych">
          <div class="t-col">
            <div class="t-label">Risk score at intake</div>
            <div class="t-score ${verdictClass(deal.verdict)}">${deal.riskScoreBefore || "—"}</div>
            <div class="t-unit">/ 100</div>
          </div>
          <div class="t-sep">→</div>
          <div class="t-col">
            <div class="t-label">Verdict</div>
            <div class="t-verdict ${verdictClass(deal.verdict)}">${titleCase(deal.verdict)}</div>
          </div>
          <div class="t-sep">→</div>
          <div class="t-col">
            <div class="t-label">Outcome</div>
            <div class="t-score dim">${deal.riskScoreAfter || "—"}</div>
            <div class="t-unit">${deal.status === "COMPLETED" ? "confirmed" : "pending"}</div>
          </div>
        </div>
        <div class="deal-card-foot">
          <span class="deal-escrow-tag">${formatPaymentStatus(deal.paymentStatus)}</span>
          <span class="v-badge ${verdictClass(deal.verdict)}">${verdictLabel(deal.verdict)}</span>
        </div>
      </a>
    `).join("");

  const totalDeals = deals.length;
  const activeMemos = deals.filter((deal) => ["DIAGNOSING", "MEMO_DELIVERED", "OUTCOME_WINDOW"].includes(deal.status)).length;
  const confirmedOutcomes = deals.filter((deal) => deal.status === "COMPLETED").length;

  res.send(renderTemplate("deals", buildPageData({
    title: `${SITE_TITLE} | Your Diagnostics`,
    authState: formatAuthState(user),
    userJson: JSON.stringify(user),
    totalDeals,
    activeMemos,
    confirmedOutcomes,
    dealsHtml
  })));
});
app.get("/deals/:id", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.redirect("/login");

  const dealId = req.params.id;

  try {
    const where = user.role === "OPERATOR"
      ? { id: dealId }
      : { id: dealId, clientId: user.id };

    const deal = await prisma.deal.findFirst({
      where,
      include: {
        signals: { orderBy: [{ severity: "desc" }, { pulledAt: "desc" }] },
        timeline: { orderBy: { createdAt: "asc" } }
      }
    });

    if (!deal) {
      return res.status(404).send("Deal not found");
    }

    const signalsBySeverity = {
      CRITICAL: deal.signals.filter((s) => s.severity === "CRITICAL"),
      HIGH: deal.signals.filter((s) => s.severity === "HIGH"),
      MEDIUM: deal.signals.filter((s) => s.severity === "MEDIUM"),
      LOW: deal.signals.filter((s) => s.severity === "LOW")
    };

    const verdictClass = deal.verdict ? deal.verdict.toLowerCase() : "pending";

    const signalsHtml = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => {
      const group = signalsBySeverity[sev];
      if (!group.length) return "";
      const rows = group.map((sig) => `
        <div class="signal-row">
          <div class="signal-source-chip">${sig.source}</div>
          <div class="signal-label">${sig.label}</div>
          <div class="signal-category">${sig.category.replace(/_/g, " ")}</div>
        </div>
      `).join("");
      return `
        <div class="signal-group">
          <div class="signal-group-header signal-group-header--${sev.toLowerCase()}">
            <div class="signal-group-dot signal-group-dot--${sev.toLowerCase()}"></div>
            <span>${sev}</span>
            <span class="signal-group-count">${group.length}</span>
          </div>
          ${rows}
        </div>
      `;
    }).join("");

    const timelineHtml = deal.timeline.map((event) => `
      <div class="tl-item">
        <div class="tl-dot done">✓</div>
        <div class="tl-content">
          <div class="tl-title">${event.event.replace(/_/g, " ")}</div>
          <div class="tl-sub">${new Date(event.createdAt).toISOString()}</div>
          ${event.hash ? `<div class="tl-hash">${event.hash}</div>` : ""}
          ${event.detail ? `<div class="tl-detail">${event.detail}</div>` : ""}
        </div>
      </div>
    `).join("");

    const allSources = ["Baltimore City Open Data", "Maryland SDAT", "SAM.gov", "eMMA", "Baltimore 311", "Baltimore Infrastructure Data"];
    const sourcesHtml = allSources.map((src) => {
      const used = deal.signalSources && deal.signalSources.includes(src);
      return `
        <div class="source-card-item ${used ? "source-used" : "source-unused"}">
          <div class="source-card-dot"></div>
          <div class="source-card-name">${src}</div>
          <div class="source-card-status">${used ? "Read" : "No signals"}</div>
        </div>
      `;
    }).join("");

    const meaningMap = {
      PROCEED: {
        cls: "meaning-proceed",
        icon: "✓",
        title: "Public records support proceeding",
        desc: "No critical flags identified. Ownership continuity, lien pressure, and utility signals are within normal range for this address."
      },
      CAUTION: {
        cls: "meaning-caution",
        icon: "!",
        title: "Proceed carefully - notable flags identified",
        desc: "Public records show elevated pressure in one or more categories. Review the signals below before committing capital."
      },
      ESCALATE: {
        cls: "meaning-escalate",
        icon: "✗",
        title: "Do not proceed without full diligence",
        desc: "Critical flags require investigation before capital is committed. One or more signals indicate material risk."
      }
    };
    const meaning = meaningMap[deal.verdict] || meaningMap.CAUTION;
    const commercialState = describeCommercialState(deal);

    res.send(renderTemplate("deal-detail", buildPageData({
      title: `${SITE_TITLE} | ${deal.address}`,
      authState: formatAuthState(user),
      userJson: JSON.stringify(user || null),
      dealId: deal.id,
      dealAddress: deal.address,
      dealVerdict: deal.verdict || "PENDING",
      verdictClass,
      riskScore: Math.round(deal.riskScoreBefore || 0),
      flagCount: deal.flagCountBefore || 0,
      signalCount: deal.signals.length,
      sourceCount: (deal.signalSources || []).length,
      createdAt: new Date(deal.createdAt).toISOString(),
      signalsHtml,
      timelineHtml,
      sourcesHtml,
      meaningClass: meaning.cls,
      meaningIcon: meaning.icon,
      meaningTitle: meaning.title,
      meaningDesc: meaning.desc,
      commercialStateTitle: commercialState.title,
      commercialStateDesc: commercialState.description,
      memoDelivered: deal.memoDeliveredAt ? "true" : "",
      paymentStatus: deal.paymentStatus
    })));
  } catch (err) {
    console.error("[deal-detail]", err);
    res.status(500).send("Server error loading deal");
  }
});
app.get("/track-record", async (req, res) => {
  const user = await getCurrentUser(req);

  const allDeals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" }
  });
  const realDeals = allDeals.filter((deal) => !isDemoDeal(deal));
  const deliveredDeals = realDeals.filter(isPaidMemoDeal);
  const completedDeals = realDeals.filter((deal) => deal.status === "COMPLETED");

  const deliveredHours = deliveredDeals
    .filter((deal) => deal.memoDeliveredAt)
    .map((deal) => Math.max(0, (new Date(deal.memoDeliveredAt).getTime() - new Date(deal.createdAt).getTime()) / 36e5));
  const averageDelivery = deliveredHours.length
    ? `${Math.round(deliveredHours.reduce((sum, hours) => sum + hours, 0) / deliveredHours.length)}h`
    : "—";
  const verdictClass = (verdict) => verdict ? verdict.toLowerCase() : "pending";

  const rowsHtml = completedDeals.length
    ? completedDeals.map((deal) => `
      <div class="track-row">
        <div class="track-cell track-address">${deal.address}</div>
        <div class="track-cell"><span class="v-badge ${verdictClass(deal.verdict)}">${deal.verdict || "PENDING"}</span></div>
        <div class="track-cell track-status">${deal.outcomeConfirmedAt ? "Confirmed" : "Pending"}</div>
        <div class="track-cell track-date">${new Date(deal.createdAt).toLocaleDateString()}</div>
        <div class="track-cell"><span class="hash-chip">${deal.memoHash ? `${deal.memoHash.slice(0, 12)}…` : "—"}</span></div>
      </div>
    `).join("")
    : '<div class="empty-state"><div>No completed deals are in the ledger yet.</div><div>This ledger only fills after StoneBridge delivers paid memos and those deals reach confirmed outcomes.</div><div class="empty-state-action"><a class="btn btn-ghost" href="/submit">Start with a live address</a></div></div>';

  res.send(renderTemplate("track-record", buildPageData({
    title: `${SITE_TITLE} | Track Record`,
    authState: formatAuthState(user, "Login"),
    userJson: JSON.stringify(user || null),
    totalMemos: deliveredDeals.length,
    completedDeals: completedDeals.length,
    riskExposure: `$${Math.round(deliveredDeals.reduce((sum, deal) => sum + (deal.amountCents || 0), 0) / 100).toLocaleString()}`,
    verdictAccuracy: `${completedDeals.length}`,
    avgDelivery: averageDelivery,
    rowsHtml
  })));
});
app.get("/operator", async (req, res) => {
  const user = await getCurrentUser(req);
  const hasCode = req.query.code === config.operatorAccessCode;
  const canAccess = hasCode || user?.role === "OPERATOR" || Boolean(user?.ownedWorkspaces?.length);
  if (!canAccess) return res.redirect("/login");
  return res.send(renderTemplate("operator", buildPageData({
    title: `${SITE_TITLE} | Operator`,
    authState: formatAuthState(user, "Operator access code"),
    userJson: JSON.stringify(user || null),
    accessCodeHash: crypto.createHash("sha256").update(config.operatorAccessCode).digest("hex")
  })));
});

app.use("/api/auth", authRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/operator", operatorRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/sponsor", sponsorRoutes);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    res.json({
      ok: true,
      service: "stonebridge-web",
      database: "reachable",
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: "stonebridge-web",
      database: "unreachable",
      error: "database_unavailable",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/_health", (_req, res) => {
  res.json({ status: "ok", publicPath });
});

app.use((error, req, res, _next) => {
  const status = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  const wantsHtml = typeof req.accepts === "function" && req.accepts("html") && !req.path.startsWith("/api/");
  if (wantsHtml) {
    return res.status(status).type("html").send(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Error</title>` +
        `<meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<link rel="stylesheet" href="/css/app.css" /></head><body class="app-shell">` +
        `<div class="container" style="padding:48px 24px"><h1 class="page-title">Something went wrong</h1>` +
        `<p class="subcopy">${escapeHtml(message)}</p><p><a class="btn btn-primary" href="/">Return home</a></p></div></body></html>`
    );
  }
  res.status(status).json({ error: message });
});

if (require.main === module) {
  startJobs();
  app.listen(config.port, () => {
    console.log(`StoneBridge publicPath: ${publicPath}`);
    console.log(`StoneBridge running on http://localhost:${config.port}`);
  });
}

module.exports = { app };
