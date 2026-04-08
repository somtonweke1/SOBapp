const { readTokenFromRequest, verifyToken } = require("./auth");
const { prisma } = require("./prisma");
const { isDemoEmail } = require("./demo-emails");

/** Loads the user row for a valid JWT on the request, or null when absent or invalid. */
async function loadSessionUser(req, { includeWorkspaces = false } = {}) {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return null;
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: includeWorkspaces
        ? { ownedWorkspaces: { select: { id: true, slug: true, name: true }, orderBy: { createdAt: "asc" }, take: 1 } }
        : undefined
    });
    return user || null;
  } catch (error) {
    if (process.env.NODE_ENV !== "test") console.warn("[session]", error.message);
    return null;
  }
}

/** Returns null for demo seeded users so public pages behave like logged-out for those identities. */
function hideDemoPublicUser(user) {
  if (!user?.email) return user;
  return isDemoEmail(user.email) ? null : user;
}

module.exports = { loadSessionUser, hideDemoPublicUser };
