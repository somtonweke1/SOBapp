const jwt = require("jsonwebtoken");
const { config } = require("./config");

/** Parses a raw `Cookie` header into a plain key/value map. */
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

/** Returns the bearer token or HttpOnly `token` cookie value, if present. */
function readTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies.token || null;
}

/** Verifies a JWT using the configured secret. */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

/** Sets the HttpOnly session cookie used by server-rendered pages. */
function setAuthCookie(res, token) {
  res.setHeader("Set-Cookie", `token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
}

/** Clears the session cookie on logout. */
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
