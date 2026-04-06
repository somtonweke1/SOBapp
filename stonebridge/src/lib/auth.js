const jwt = require("jsonwebtoken");
const { config } = require("./config");

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name || null },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

function readTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies.token || null;
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function setAuthCookie(res, token) {
  res.setHeader("Set-Cookie", `token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
}

function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", "token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
}

module.exports = {
  parseCookies,
  signToken,
  readTokenFromRequest,
  verifyToken,
  setAuthCookie,
  clearAuthCookie
};
