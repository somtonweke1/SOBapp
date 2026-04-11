/**
 * Spatial Risk Analysis Service
 * Performs GIS-based risk analysis using PostGIS spatial queries
 */

const { prisma } = require('../lib/prisma');

/**
 * Calculate complaint density within buffer radius
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @param {number} radiusMeters - Buffer radius in meters (default: 500)
 * @returns {Promise<{count: number, density: number}>}
 */
async function calculateComplaintDensity(latitude, longitude, radiusMeters = 500) {
  try {
    // Using PostGIS ST_DWithin to find complaints within radius
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "ServiceRequest"
      WHERE ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
    `;

    const count = parseInt(result[0]?.count || 0);
    const bufferAreaKm2 = (Math.PI * Math.pow(radiusMeters / 1000, 2));
    const density = bufferAreaKm2 > 0 ? count / bufferAreaKm2 : 0;

    return {
      count,
      density: Math.round(density * 100) / 100,
      radiusMeters
    };
  } catch (error) {
    console.warn('[SpatialRisk] Complaint density query failed:', error.message);
    return { count: 0, density: 0, radiusMeters, error: error.message };
  }
}

/**
 * Calculate vacant property exposure within buffer
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @param {number} radiusMeters - Buffer radius in meters (default: 500)
 * @returns {Promise<{count: number, distance_to_nearest: number}>}
 */
async function calculateVacancyExposure(latitude, longitude, radiusMeters = 500) {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        COUNT(*) as count,
        MIN(ST_Distance(
          geom::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        )) as min_distance
      FROM "VacantProperty"
      WHERE ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
    `;

    return {
      count: parseInt(result[0]?.count || 0),
      nearestDistanceMeters: result[0]?.min_distance ? Math.round(result[0].min_distance) : null,
      radiusMeters
    };
  } catch (error) {
    console.warn('[SpatialRisk] Vacancy exposure query failed:', error.message);
    return { count: 0, nearestDistanceMeters: null, radiusMeters, error: error.message };
  }
}

/**
 * Check if property intersects flood zone
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<{inFloodZone: boolean, floodZoneType: string}>}
 */
async function checkFloodZone(latitude, longitude) {
  try {
    const result = await prisma.$queryRaw`
      SELECT zone_type
      FROM "FloodZone"
      WHERE ST_Intersects(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      LIMIT 1
    `;

    if (result && result.length > 0) {
      return {
        inFloodZone: true,
        floodZoneType: result[0].zone_type
      };
    }

    return {
      inFloodZone: false,
      floodZoneType: null
    };
  } catch (error) {
    console.warn('[SpatialRisk] Flood zone query failed:', error.message);
    return { inFloodZone: false, floodZoneType: null, error: error.message };
  }
}

/**
 * Get zoning classification for property
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<{zoningType: string}>}
 */
async function getZoningClassification(latitude, longitude) {
  try {
    const result = await prisma.$queryRaw`
      SELECT zoning_code, zoning_description
      FROM "Zoning"
      WHERE ST_Intersects(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      LIMIT 1
    `;

    if (result && result.length > 0) {
      return {
        zoningCode: result[0].zoning_code,
        zoningDescription: result[0].zoning_description
      };
    }

    return {
      zoningCode: null,
      zoningDescription: null
    };
  } catch (error) {
    console.warn('[SpatialRisk] Zoning query failed:', error.message);
    return { zoningCode: null, zoningDescription: null, error: error.message };
  }
}

/**
 * Compute composite spatial risk score
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @returns {Promise<Object>} Spatial risk indicators and score
 */
async function computeSpatialRisk(latitude, longitude) {
  if (!latitude || !longitude) {
    return {
      error: 'Missing coordinates',
      spatialRiskScore: null,
      indicators: null
    };
  }

  // Run all spatial queries in parallel
  const [complaints, vacancy, floodZone, zoning] = await Promise.all([
    calculateComplaintDensity(latitude, longitude, 500),
    calculateVacancyExposure(latitude, longitude, 500),
    checkFloodZone(latitude, longitude),
    getZoningClassification(latitude, longitude)
  ]);

  // Normalize indicators to 0-1 scale
  const complaintScore = Math.min(complaints.count / 25, 1); // 25+ complaints = max risk
  const vacancyScore = Math.min(vacancy.count / 10, 1); // 10+ vacant properties = max risk
  const floodScore = floodZone.inFloodZone ? 1 : 0;

  // Composite risk (weighted average)
  const spatialRiskScore = (
    complaintScore * 0.4 +
    vacancyScore * 0.3 +
    floodScore * 0.3
  );

  // Convert to 0-100 scale
  const normalizedScore = Math.round(spatialRiskScore * 100);

  // Determine spatial verdict
  let spatialVerdict;
  if (normalizedScore >= 65) spatialVerdict = 'ESCALATE';
  else if (normalizedScore >= 40) spatialVerdict = 'CAUTION';
  else spatialVerdict = 'PROCEED';

  return {
    spatialRiskScore: normalizedScore,
    spatialVerdict,
    indicators: {
      complaints,
      vacancy,
      floodZone,
      zoning
    },
    weights: {
      complaints: 0.4,
      vacancy: 0.3,
      floodZone: 0.3
    }
  };
}

/**
 * Get spatial context data for GeoJSON export
 * @param {number} latitude - Property latitude
 * @param {number} longitude - Property longitude
 * @param {number} radiusMeters - Buffer radius
 * @returns {Promise<Object>} GeoJSON feature collection
 */
async function getSpatialContext(latitude, longitude, radiusMeters = 500) {
  try {
    // Get nearby complaints
    const complaints = await prisma.$queryRaw`
      SELECT
        id,
        request_type,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        created_date,
        status
      FROM "ServiceRequest"
      WHERE ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
      LIMIT 100
    `;

    // Get nearby vacant properties
    const vacancies = await prisma.$queryRaw`
      SELECT
        id,
        address,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        notice_date
      FROM "VacantProperty"
      WHERE ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusMeters}
      )
      LIMIT 100
    `;

    return {
      type: 'FeatureCollection',
      features: [
        // Property point
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          properties: {
            type: 'property',
            radiusMeters
          }
        },
        // Complaint points
        ...complaints.map(c => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(c.longitude), parseFloat(c.latitude)]
          },
          properties: {
            type: 'complaint',
            requestType: c.request_type,
            status: c.status,
            date: c.created_date
          }
        })),
        // Vacancy points
        ...vacancies.map(v => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(v.longitude), parseFloat(v.latitude)]
          },
          properties: {
            type: 'vacancy',
            address: v.address,
            noticeDate: v.notice_date
          }
        }))
      ]
    };
  } catch (error) {
    console.error('[SpatialRisk] Spatial context query failed:', error.message);
    return {
      type: 'FeatureCollection',
      features: [],
      error: error.message
    };
  }
}

module.exports = {
  calculateComplaintDensity,
  calculateVacancyExposure,
  checkFloodZone,
  getZoningClassification,
  computeSpatialRisk,
  getSpatialContext
};
