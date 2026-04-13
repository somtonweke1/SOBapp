/** Spatial visualization API endpoints */
const express = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/spatial/:dealId
 * Returns spatial data for map visualization
 */
router.get("/:dealId", requireAuth, asyncHandler(async (req, res) => {
  const { dealId } = req.params;

  // Get the deal with coordinates
  const deal = await prisma.deal.findUnique({
    where: { id: dealId, clientId: req.user.id }
  });

  if (!deal) {
    return sendError(res, 404, "Deal not found");
  }

  if (!deal.latitude || !deal.longitude) {
    return res.json({
      hasCoordinates: false,
      message: "Address could not be geocoded"
    });
  }

  const lat = deal.latitude;
  const lon = deal.longitude;
  const radiusMeters = 500;

  // Query service requests within radius
  const complaints = await prisma.$queryRaw`
    SELECT
      id,
      service_request_num as "requestNum",
      service_name as "serviceName",
      description,
      address,
      status_description as "status",
      latitude,
      longitude,
      created_date as "createdDate",
      ST_Distance(
        geom,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
      ) as "distanceMeters"
    FROM "ServiceRequest"
    WHERE ST_DWithin(
      geom,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
      ${radiusMeters}
    )
    ORDER BY "distanceMeters"
    LIMIT 100
  `;

  // Query vacant properties within radius
  const vacancies = await prisma.$queryRaw`
    SELECT
      id,
      reference,
      address,
      neighborhood,
      latitude,
      longitude,
      notice_date as "noticeDate",
      ST_Distance(
        geom,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
      ) as "distanceMeters"
    FROM "VacantProperty"
    WHERE ST_DWithin(
      geom,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
      ${radiusMeters}
    )
    ORDER BY "distanceMeters"
    LIMIT 50
  `;

  // Format data for frontend
  res.json({
    hasCoordinates: true,
    center: {
      lat,
      lon,
      address: `${deal.address}, ${deal.city}, ${deal.state}`
    },
    radius: radiusMeters,
    complaints: complaints.map(c => ({
      id: c.id,
      requestNum: c.requestNum,
      serviceName: c.serviceName,
      description: c.description,
      address: c.address,
      status: c.status,
      lat: Number(c.latitude),
      lon: Number(c.longitude),
      distance: Math.round(Number(c.distanceMeters)),
      createdDate: c.createdDate
    })),
    vacancies: vacancies.map(v => ({
      id: v.id,
      reference: v.reference,
      address: v.address,
      neighborhood: v.neighborhood,
      lat: Number(v.latitude),
      lon: Number(v.longitude),
      distance: Math.round(Number(v.distanceMeters)),
      noticeDate: v.noticeDate
    })),
    summary: {
      complaintCount: complaints.length,
      vacancyCount: vacancies.length,
      nearestComplaint: complaints.length > 0 ? Math.round(Number(complaints[0].distanceMeters)) : null,
      nearestVacancy: vacancies.length > 0 ? Math.round(Number(vacancies[0].distanceMeters)) : null
    }
  });
}));

module.exports = router;
