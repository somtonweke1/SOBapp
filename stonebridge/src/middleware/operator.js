const { config } = require("../lib/config");

function requireOperator(req, res, next) {
  const accessCode = req.headers["x-operator-access-code"] || req.query.code;
  if (accessCode && accessCode === config.operatorAccessCode) {
    req.operatorAccessCode = accessCode;
    return next();
  }
  if (!req.user || req.user.role !== "OPERATOR") {
    return res.status(403).json({ error: "Operator access required" });
  }
  next();
}

module.exports = { requireOperator };
