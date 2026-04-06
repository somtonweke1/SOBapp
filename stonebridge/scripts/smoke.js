const REQUIRED_MATCHES = [
  { path: "/", includes: ["StoneBridge AI", "Start free preview"] },
  { path: "/submit", includes: ["Run free preview", "$2,500 decision memo"] },
  { path: "/track-record", includes: ["Credibility Ledger"] },
  { path: "/healthz", includes: ['"ok":true', '"database":"reachable"'] }
];

async function main() {
  const baseUrl = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "");

  for (const check of REQUIRED_MATCHES) {
    const response = await fetch(`${baseUrl}${check.path}`);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Smoke check failed for ${check.path}: HTTP ${response.status}`);
    }

    for (const needle of check.includes) {
      if (!text.includes(needle)) {
        throw new Error(`Smoke check failed for ${check.path}: missing "${needle}"`);
      }
    }
  }

  console.log(`Smoke checks passed against ${baseUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
