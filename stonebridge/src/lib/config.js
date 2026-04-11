const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

/** Populates `process.env` from a repo-root `.env` file when those keys are not already set. */
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  try {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      const rawValue = line.slice(index + 1).trim();
      const value = rawValue.replace(/^"(.*)"$/, "$1");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    console.error("[config] Failed to load .env file:", error.message);
    // Non-fatal: continue with environment variables only
  }
}

loadEnv();

const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "change-me",
  databaseUrl: process.env.DATABASE_URL,
  operatorAccessCode: process.env.OPERATOR_ACCESS_CODE || "SB-334",
  baltimoreAppToken: process.env.BALTIMORE_OPEN_DATA_APP_TOKEN || "",
  samGovApiKey: process.env.SAM_GOV_API_KEY || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ""
};

// Validate critical configuration in production
if (process.env.NODE_ENV === "production") {
  if (!config.jwtSecret || config.jwtSecret === "change-me") {
    throw new Error("FATAL: JWT_SECRET must be set to a secure value in production");
  }
  if (!config.databaseUrl) {
    throw new Error("FATAL: DATABASE_URL must be set in production");
  }
}

const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

module.exports = { config, stripe };
