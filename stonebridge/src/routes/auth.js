const express = require("express");
const bcrypt = require("bcrypt");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { signToken, setAuthCookie } = require("../lib/auth");
const { requireAuth } = require("../middleware/auth");
const { isValidEmail, isValidWorkspaceSlug, normalizeEmail } = require("../lib/validation");

const router = express.Router();

const MIN_PASSWORD_LENGTH = 8;

router.post("/register", asyncHandler(async (req, res) => {
  const { email, password, name, workspaceName, workspaceSlug, workspaceStrapline } = req.body;
  if (!email || !password) return sendError(res, 400, "Email and password are required");
  const emailNorm = normalizeEmail(email);
  if (!isValidEmail(emailNorm)) return sendError(res, 400, "Enter a valid email address");
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return sendError(res, 400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) return sendError(res, 409, "User already exists");
  if (workspaceSlug) {
    const slugTrim = String(workspaceSlug).trim();
    if (!isValidWorkspaceSlug(slugTrim)) return sendError(res, 400, "Workspace slug must be 2–80 chars, letters, numbers, hyphens");
    const existingWorkspace = await prisma.sponsorWorkspace.findUnique({ where: { slug: slugTrim } });
    if (existingWorkspace) return sendError(res, 409, "Workspace slug already exists");
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: emailNorm,
        password: await bcrypt.hash(password, 10),
        name: name ? String(name).trim() : null,
        role: "CLIENT"
      }
    });

    if (workspaceName && workspaceSlug) {
      const slugTrim = String(workspaceSlug).trim();
      await tx.sponsorWorkspace.create({
        data: {
          ownerId: createdUser.id,
          name: String(workspaceName).trim(),
          slug: slugTrim,
          strapline: String(workspaceStrapline || "Sponsor intelligence for disciplined real estate operators.").trim(),
          overview: "Update this workspace overview from the console to publish your sponsor narrative, target audience, and opportunity framing.",
          fundName: `${String(workspaceName).trim()} Fund I`,
          targetRaise: "Set target raise",
          targetProfile: "Define target investor profile",
          geographies: [],
          thesis: [],
          metrics: [],
          trackRecord: [],
          faqs: []
        }
      });
    }

    return createdUser;
  });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, token });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: String(email || "").toLowerCase() } });
  if (!user) return sendError(res, 401, "Invalid credentials");

  const valid = await bcrypt.compare(password || "", user.password);
  if (!valid) return sendError(res, 401, "Invalid credentials");

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, token });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const workspace = await prisma.sponsorWorkspace.findFirst({
    where: { ownerId: req.user.id },
    select: { id: true, slug: true, name: true }
  });
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name, workspace } });
}));

module.exports = router;
