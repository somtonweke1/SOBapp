/** Sponsor workspace, opportunity, and inquiry helpers (serialization and Prisma queries). */
const crypto = require("crypto");
const { prisma } = require("./prisma");
const { buildDistributionIntelligence } = require("./sponsor-distribution");

/** Generates a random hex string for sponsor-room access codes. */
function createAccessCode() {
  return crypto.randomBytes(12).toString("hex");
}

function normalizeJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function serializeWorkspaceSummary(workspace) {
  if (!workspace) return null;
  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    strapline: workspace.strapline,
    fundName: workspace.fundName,
    targetRaise: workspace.targetRaise,
    targetProfile: workspace.targetProfile
  };
}

function serializeOpportunity(opportunity) {
  if (!opportunity) return null;
  return {
    id: opportunity.id,
    workspaceSlug: opportunity.workspace?.slug || null,
    slug: opportunity.slug,
    title: opportunity.title,
    market: opportunity.market,
    assetType: opportunity.assetType,
    stage: opportunity.stage,
    targetEquity: opportunity.targetEquity,
    targetHold: opportunity.targetHold,
    summary: opportunity.summary,
    thesis: opportunity.thesis,
    diligence: opportunity.diligence,
    roomNotes: opportunity.roomNotes,
    isActive: opportunity.isActive
  };
}

function serializeWorkspace(workspace) {
  if (!workspace) return null;
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    strapline: workspace.strapline,
    overview: workspace.overview,
    fund: {
      name: workspace.fundName,
      targetRaise: workspace.targetRaise,
      targetProfile: workspace.targetProfile,
      geographies: workspace.geographies,
      thesis: workspace.thesis
    },
    metrics: normalizeJsonArray(workspace.metrics),
    trackRecord: normalizeJsonArray(workspace.trackRecord),
    faqs: normalizeJsonArray(workspace.faqs)
  };
}

function serializeInquiry(inquiry) {
  return {
    ...inquiry,
    workspace: inquiry.workspace ? { id: inquiry.workspace.id, slug: inquiry.workspace.slug, name: inquiry.workspace.name } : null,
    opportunity: serializeOpportunity(inquiry.opportunity),
    roomUrl: inquiry.roomAccessGranted && inquiry.opportunity && (inquiry.workspace?.slug || inquiry.opportunity.workspace?.slug)
      ? `/capital/${inquiry.workspace?.slug || inquiry.opportunity.workspace?.slug}/room/${inquiry.opportunity.slug}?access=${inquiry.accessCode}`
      : null
  };
}

async function getActiveWorkspace() {
  return prisma.sponsorWorkspace.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      opportunities: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

async function getWorkspaceBySlug(slug) {
  if (!slug) return null;
  return prisma.sponsorWorkspace.findUnique({
    where: { slug },
    include: {
      opportunities: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

async function getWorkspaceByOwnerId(ownerId) {
  if (!ownerId) return null;
  return prisma.sponsorWorkspace.findFirst({
    where: { ownerId },
    include: {
      opportunities: { orderBy: { createdAt: "asc" } }
    }
  });
}

async function listActiveWorkspaces() {
  const workspaces = await prisma.sponsorWorkspace.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  });
  return workspaces.map(serializeWorkspaceSummary);
}

async function getWorkspaceOverview(slug) {
  const workspace = slug ? await getWorkspaceBySlug(slug) : await getActiveWorkspace();
  if (!workspace) {
    throw Object.assign(new Error("No sponsor workspace configured"), { statusCode: 404 });
  }

  return {
    profile: serializeWorkspace(workspace),
    opportunities: workspace.opportunities.map(serializeOpportunity),
    distributionIntelligence: buildDistributionIntelligence(serializeWorkspace(workspace), workspace.opportunities.map(serializeOpportunity))
  };
}

async function getOpportunityBySlug(workspaceSlug, slug) {
  const opportunity = await prisma.sponsorOpportunity.findFirst({
    where: {
      slug,
      workspace: workspaceSlug ? { slug: workspaceSlug } : undefined
    },
    include: {
      workspace: true
    }
  });
  if (!opportunity || !opportunity.isActive || !opportunity.workspace?.isActive) return null;
  return opportunity;
}

async function getInquiryAnalytics(workspaceId) {
  const inquiries = await prisma.investorInquiry.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      workspace: true,
      opportunity: true
    }
  });

  const byStatus = {
    NEW: 0,
    QUALIFIED: 0,
    FOLLOW_UP: 0,
    ROOM_GRANTED: 0,
    CLOSED: 0
  };

  for (const inquiry of inquiries) byStatus[inquiry.status] += 1;

  return {
    totalInquiries: inquiries.length,
    qualifiedCount: byStatus.QUALIFIED + byStatus.ROOM_GRANTED,
    roomGrantedCount: byStatus.ROOM_GRANTED,
    avgTurnaround: inquiries.length ? "24h" : "—",
    byStatus,
    inquiries: inquiries.map(serializeInquiry)
  };
}

module.exports = {
  createAccessCode,
  serializeWorkspace,
  serializeOpportunity,
  serializeInquiry,
  serializeWorkspaceSummary,
  getActiveWorkspace,
  getWorkspaceBySlug,
  getWorkspaceByOwnerId,
  listActiveWorkspaces,
  getWorkspaceOverview,
  getOpportunityBySlug,
  getInquiryAnalytics
};
