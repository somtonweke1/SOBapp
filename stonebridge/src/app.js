const express = require("express");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const { prisma } = require("./lib/prisma");
const { config } = require("./lib/config");
const { renderTemplate } = require("./lib/template");
const { readTokenFromRequest, verifyToken } = require("./lib/auth");
const authRoutes = require("./routes/auth");
const dealRoutes = require("./routes/deals");
const operatorRoutes = require("./routes/operator");
const paymentRoutes = require("./routes/payments");
const publicRoutes = require("./routes/public");
const sponsorRoutes = require("./routes/sponsor");
const { listActiveWorkspaces } = require("./lib/sponsor");
const { SITE_DESCRIPTION, SITE_TITLE } = require("./lib/site");
const { startJobs } = require("./jobs");

const app = express();
const publicPath = path.resolve(__dirname, "..", "public");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.use("/memos", express.static(path.resolve(__dirname, "..", "memos")));

async function getCurrentUser(req) {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return null;
    const payload = verifyToken(token);
    return prisma.user.findUnique({
      where: { id: payload.sub },
      include: { ownedWorkspaces: { select: { id: true, slug: true, name: true }, orderBy: { createdAt: "asc" }, take: 1 } }
    });
  } catch {
    return null;
  }
}

function buildPageData(base = {}) {
  return {
    brand: "STONEBRIDGE AI",
    nav: "",
    pageScript: "",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    ...base
  };
}

function formatAuthState(user, fallback = "Login") {
  if (!user) return fallback;
  if (user.email === "guest@stonebridge.ai") return "Preview session";
  if (user.role === "OPERATOR") return `${user.name || user.email} · Operator`;
  return user.name || user.email;
}

function formatAvgDeliveryHours(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${Math.round(value)}h`;
}

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

app.get("/", async (req, res) => {
  const user = await getCurrentUser(req);
  const stats = await prisma.deal.aggregate({ _count: { id: true }, _avg: { riskScoreBefore: true } });
  const allDeals = await prisma.deal.findMany({
    select: {
      amountCents: true,
      createdAt: true,
      memoDeliveredAt: true,
      paymentStatus: true,
      status: true
    }
  });
  const memoDeals = allDeals.filter(isPaidMemoDeal);
  const completed = await prisma.deal.count({
    where: { status: "COMPLETED" }
  });
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
    avgRiskScore: Math.round(stats._avg.riskScoreBefore || 0)
  }));
  res.send(html);
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
app.get("/deals", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.redirect("/login");

  const deals = await prisma.deal.findMany({
    where: { clientId: user.id },
    include: { signals: true },
    orderBy: { createdAt: "desc" }
  });

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
          <div class="tol">
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

    const allSources = ["Baltimore City Open Data", "Maryland SDAT", "SAM.gov", "eMMA", "Baltimore 311", "City Infrastructure"];
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
  const deliveredDeals = allDeals.filter(isPaidMemoDeal);
  const completedDeals = allDeals.filter((deal) => deal.status === "COMPLETED");

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
  const userCount = await prisma.user.count().catch(() => null);
  res.json({ ok: true, userCount });
});

app.get("/_health", (_req, res) => {
  res.json({ status: "ok", publicPath });
});

app.use((error, _req, res, _next) => {
  const status = error.statusCode || 500;
  res.status(status).json({ error: error.message || "Internal Server Error" });
});

if (require.main === module) {
  startJobs();
  app.listen(config.port, () => {
    console.log(`StoneBridge publicPath: ${publicPath}`);
    console.log(`StoneBridge running on http://localhost:${config.port}`);
  });
}

module.exports = { app };
