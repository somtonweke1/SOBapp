/** Batch address analysis endpoints */
const { Router } = require("express");
const { PrismaClient } = require("@prisma/client");
const { diagnose } = require("../engine/diagnose");
const { geocodeAddress } = require("../services/geocode");
const { requireAuth } = require("../middleware/auth");

// Simple error handling helpers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
const sendError = (res, status, message) => {
  res.status(status).json({ success: false, message });
};

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/batch
 * Upload CSV of addresses and analyze all
 *
 * Expected CSV format:
 * address,city,state
 * 123 Main St,Baltimore,MD
 * 456 Oak Ave,Baltimore,MD
 */
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const { addresses } = req.body;

  // Validate input
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return sendError(res, 400, "addresses array required");
  }

  if (addresses.length > 50) {
    return sendError(res, 400, "Maximum 50 addresses per batch");
  }

  // Validate each address
  for (const addr of addresses) {
    if (!addr.address || !addr.city || !addr.state) {
      return sendError(res, 400, "Each address must have address, city, and state fields");
    }
  }

  console.log(`[batch] Processing ${addresses.length} addresses for user ${req.user.id}`);

  const results = [];
  const errors = [];

  // Process each address
  for (const addrInput of addresses) {
    try {
      // Geocode
      const geoResult = await geocodeAddress(
        addrInput.address,
        addrInput.city || "Baltimore",
        addrInput.state || "MD"
      );

      // Create deal record
      const deal = await prisma.deal.create({
        data: {
          address: addrInput.address,
          city: addrInput.city || "Baltimore",
          state: addrInput.state || "MD",
          latitude: geoResult?.latitude || null,
          longitude: geoResult?.longitude || null,
          clientId: req.user.id,
          status: "DIAGNOSING",
          signalSources: [],
        },
      });

      // Run diagnosis
      const diagnostic = await diagnose(deal.id);

      results.push({
        dealId: deal.id,
        address: deal.address,
        city: deal.city,
        state: deal.state,
        verdict: diagnostic.verdict,
        riskScore: diagnostic.riskScoreAfter,
        flagCount: diagnostic.flagCountAfter,
        signalCount: diagnostic.signals?.length || 0,
        latitude: deal.latitude,
        longitude: deal.longitude,
      });

      console.log(`[batch] ✓ ${deal.address} - ${diagnostic.verdict} (${diagnostic.flagCountAfter} flags)`);
    } catch (error) {
      console.error(`[batch] ✗ ${addrInput.address}:`, error.message);
      errors.push({
        address: addrInput.address,
        error: error.message,
      });
    }
  }

  console.log(`[batch] Complete: ${results.length} succeeded, ${errors.length} failed`);

  res.json({
    success: true,
    results,
    errors,
    summary: {
      total: addresses.length,
      succeeded: results.length,
      failed: errors.length,
    },
  });
}));

/**
 * GET /api/batch/export/:format
 * Export batch results to CSV or JSON
 */
router.get("/export/:format", requireAuth, asyncHandler(async (req, res) => {
  const { format } = req.params;
  const { dealIds } = req.query;

  if (!dealIds) {
    return sendError(res, 400, "dealIds query parameter required");
  }

  const ids = dealIds.split(",");

  const deals = await prisma.deal.findMany({
    where: {
      id: { in: ids },
      clientId: req.user.id,
    },
    include: {
      signals: true,
    },
  });

  if (format === "csv") {
    // Generate CSV
    const rows = [
      ["Address", "City", "State", "Verdict", "Risk Score", "Flag Count", "Signal Count"],
      ...deals.map(d => [
        d.address,
        d.city,
        d.state,
        d.verdict || "PENDING",
        d.riskScoreAfter || "N/A",
        d.flagCountAfter || 0,
        d.signals.length,
      ]),
    ];

    const csv = rows.map(row => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="stonebridge-batch-${Date.now()}.csv"`);
    return res.send(csv);
  }

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="stonebridge-batch-${Date.now()}.json"`);
    return res.json({
      exported: new Date().toISOString(),
      count: deals.length,
      deals: deals.map(d => ({
        address: d.address,
        city: d.city,
        state: d.state,
        verdict: d.verdict,
        riskScore: d.riskScoreAfter,
        flagCount: d.flagCountAfter,
        signals: d.signals.map(s => ({
          category: s.category,
          label: s.label,
          severity: s.severity,
          source: s.source,
        })),
      })),
    });
  }

  return sendError(res, 400, "Format must be 'csv' or 'json'");
}));

module.exports = router;
