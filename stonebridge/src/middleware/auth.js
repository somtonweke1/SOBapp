const { prisma } = require("../lib/prisma");
const { readTokenFromRequest, verifyToken } = require("../lib/auth");

async function requireAuth(req, res, next) {
  try {
    const token = readTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { requireAuth };
