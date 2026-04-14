/** Spatial visualization API endpoints */
const express = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { requireAuth } = require("../middleware/auth");
const { geocodeAddress } = require("../services/geocode");
const { computeSpatialRisk, fetchNearbyComplaints, fetchNearbyVacancies } = require("../services/spatialRisk");

const router = express.Router();

/**
 * GET /api/spatial/:dealId
 * Returns spatial data for map visualization
 */
router.get("/:dealId", requireAuth, asyncHandler(async (req, res) => {
  const { dealId } = req.params;

  const where = req.user.role === "OPERATOR"
    ? { id: dealId }
    : { id: dealId, clientId: req.user.id };

  const deal = await prisma.deal.findFirst({
    where
  });

  if (!deal) {
    return sendError(res, 404, "Deal not found");
  }

  let lat = deal.latitude;
  let lon = deal.longitude;

  if (!lat || !lon) {
    const geocoded = await geocodeAddress(deal.address, deal.city, deal.state);
    if (geocoded?.latitude && geocoded?.longitude) {
      lat = geocoded.latitude;
      lon = geocoded.longitude;

      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          latitude: lat,
          longitude: lon,
          geocodeSource: geocoded.source || null,
          geocodeConfidence: geocoded.confidence || null
        }
      });

      deal.geocodeSource = geocoded.source || null;
      deal.geocodeConfidence = geocoded.confidence || null;
    }
  }

  if (!lat || !lon) {
    return res.json({
      hasCoordinates: false,
      message: "Address could not be geocoded"
    });
  }
  const radiusMeters = 500;

  const [complaints, vacancies, spatial] = await Promise.all([
    fetchNearbyComplaints(lat, lon, radiusMeters),
    fetchNearbyVacancies(lat, lon, radiusMeters),
    computeSpatialRisk(lat, lon, {
      radiusMeters,
      documentRiskScore: deal.riskScoreBefore,
      geocodeSource: deal.geocodeSource,
      geocodeConfidence: deal.geocodeConfidence
    })
  ]);

  // Format data for frontend
  res.json({
    hasCoordinates: true,
    center: {
      lat,
      lon,
      address: `${deal.address}, ${deal.city}, ${deal.state}`
    },
    radius: radiusMeters,
    complaints,
    vacancies,
    summary: {
      complaintCount: complaints.length,
      vacancyCount: vacancies.length,
      nearestComplaint: complaints.length > 0 ? complaints[0].distance : null,
      nearestVacancy: vacancies.length > 0 ? vacancies[0].distance : null
    },
    decision: {
      documentRisk: Math.round(deal.riskScoreBefore || 0),
      documentVerdict: deal.verdict || "PENDING",
      spatialRisk: spatial.spatialRiskScore,
      spatialVerdict: spatial.spatialVerdict,
      divergence: spatial.divergence,
      confidence: spatial.confidence,
      pattern: spatial.neighborhoodPattern,
      summarySentence: spatial.summarySentence,
      action: spatial.action,
      baselines: spatial.baselines,
      indicators: spatial.indicators,
      geocode: {
        source: deal.geocodeSource || 'unknown',
        confidence: deal.geocodeConfidence || 'unknown'
      }
    }
  });
}));

module.exports = router;
