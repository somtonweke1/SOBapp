/**
 * Spatial Risk Analysis Service
 * Translates Baltimore geospatial context into an operator-readable decision layer.
 */

const { prisma } = require('../lib/prisma');

const DEFAULT_RADIUS_METERS = 500;
const COMPLAINT_PERCENTILE_BANDS = [0, 1.5, 3, 5, 7.5, 10, 14, 18, 24, 32];
const DENSITY_PERCENTILE_BANDS = [0, 3, 6, 9, 12, 16, 20, 26, 34, 44];
const VACANCY_PERCENTILE_BANDS = [0, 0.5, 1, 2, 3, 4.5, 6, 8, 10, 14];
const PROXIMITY_PERCENTILE_BANDS = [0, 60, 110, 170, 230, 300, 370, 430, 470, 500];

function round(value, precision = 2) {
  const factor = Math.pow(10, precision);
  return Math.round(Number(value || 0) * factor) / factor;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(from, to = new Date()) {
  if (!from) return null;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));
}

function normalizeServiceText(...values) {
  return values
    .map((value) => String(value || '').toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getComplaintTypeWeight(record) {
  const text = normalizeServiceText(record.requestType, record.serviceName, record.description);
  if (!text) return 0.9;
  if (/(water|sewer|storm|flood|drain|sinkhole|collapse|structural|vacant|abandon|board|fire|unsafe|housing)/.test(text)) return 1.4;
  if (/(street light|roadway|pothole|sidewalk|traffic|bridge|alley|trash|bulk|illegal dump|graffiti)/.test(text)) return 1.05;
  if (/(noise|parking|animal|tree)/.test(text)) return 0.65;
  return 0.9;
}

function getRecencyWeight(dateValue) {
  const ageDays = daysBetween(parseDate(dateValue));
  if (ageDays == null) return 0.75;
  if (ageDays <= 30) return 1.3;
  if (ageDays <= 90) return 1.15;
  if (ageDays <= 180) return 1;
  if (ageDays <= 365) return 0.8;
  if (ageDays <= 730) return 0.6;
  return 0.45;
}

function getVacancyWeight(record) {
  const recency = getRecencyWeight(record.noticeDate);
  return recency >= 1 ? 1.15 : recency >= 0.8 ? 1 : 0.8;
}

function estimatePercentile(value, bands) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 8;
  let bucket = 0;
  while (bucket < bands.length && numeric >= bands[bucket]) bucket += 1;
  return Math.min(99, Math.max(10, Math.round((bucket / bands.length) * 100)));
}

function getPercentileBandLabel(percentile) {
  if (percentile >= 85) return 'well above Baltimore baseline';
  if (percentile >= 65) return 'above Baltimore baseline';
  if (percentile >= 40) return 'around Baltimore baseline';
  return 'below Baltimore baseline';
}

function buildConfidence({ geocodeSource, geocodeConfidence, complaints, vacancies }) {
  const exactLocalMatch = String(geocodeSource || '').startsWith('local:Parcel');
  const localMatch = String(geocodeSource || '').startsWith('local:');
  let score = exactLocalMatch ? 92 : localMatch ? 82 : 62;
  if (String(geocodeConfidence || '').toLowerCase() === 'high') score += 5;
  else if (String(geocodeConfidence || '').toLowerCase() === 'low') score -= 8;

  const freshestComplaintDays = complaints.reduce((best, row) => {
    const age = daysBetween(parseDate(row.createdDate));
    if (age == null) return best;
    return best == null ? age : Math.min(best, age);
  }, null);
  const freshestVacancyDays = vacancies.reduce((best, row) => {
    const age = daysBetween(parseDate(row.noticeDate));
    if (age == null) return best;
    return best == null ? age : Math.min(best, age);
  }, null);

  const freshestDays = [freshestComplaintDays, freshestVacancyDays].filter((value) => value != null).sort((a, b) => a - b)[0] ?? null;
  if (freshestDays != null && freshestDays > 730) score -= 12;
  else if (freshestDays != null && freshestDays > 365) score -= 6;

  const clamped = Math.max(38, Math.min(98, Math.round(score)));
  return {
    score: clamped,
    level: clamped >= 85 ? 'High' : clamped >= 70 ? 'Medium' : 'Low',
    reason: exactLocalMatch
      ? 'Exact parcel-backed geocode with live Baltimore context.'
      : localMatch
        ? 'Local Baltimore dataset match with usable spatial context.'
        : 'Remote geocode fallback. Read neighborhood context as directional.'
  };
}

function deriveSpatialVerdict(score) {
  if (score >= 65) return 'ESCALATE';
  if (score >= 40) return 'CAUTION';
  return 'PROCEED';
}

function deriveNeighborhoodPattern(metrics) {
  if (metrics.weightedVacancy >= 6 || metrics.weightedComplaints >= 18 || metrics.nearestVacancyMeters && metrics.nearestVacancyMeters < 120) {
    return {
      label: 'Concentrated distress',
      description: 'Complaint and vacancy pressure are clustering close enough to affect the underwriting story.'
    };
  }
  if (metrics.weightedComplaints >= 7 || metrics.weightedVacancy >= 2 || metrics.nearestVacancyMeters && metrics.nearestVacancyMeters < 220) {
    return {
      label: 'Mixed / transitional block',
      description: 'The radius is investable in places, but nearby friction is visible and should be priced explicitly.'
    };
  }
  return {
    label: 'Clean radius',
    description: 'Immediate block conditions look materially cleaner than a distressed Baltimore radius.'
  };
}

function deriveDivergence(documentRiskScore, spatialRiskScore) {
  const documentRisk = Number(documentRiskScore || 0);
  const spatialRisk = Number(spatialRiskScore || 0);
  const gap = Math.round(spatialRisk - documentRisk);
  let mode = 'LOW_LOW';
  let title = 'Low-low';
  let interpretation = 'Both the parcel screen and neighborhood context read as manageable.';

  if (documentRisk >= 40 && spatialRisk >= 40) {
    mode = 'CONVERGENT_RISK';
    title = 'Convergent risk';
    interpretation = 'The parcel screen and neighborhood context are both pointing toward elevated stress.';
  } else if (gap >= 15) {
    mode = 'HIDDEN_NEIGHBORHOOD_RISK';
    title = 'Hidden neighborhood risk';
    interpretation = 'The immediate block context is materially worse than the document screen suggests.';
  } else if (gap <= -15) {
    mode = 'PROPERTY_SPECIFIC_RISK';
    title = 'Property-specific risk';
    interpretation = 'Parcel-level friction exceeds what the surrounding neighborhood is signaling.';
  }

  return { documentRisk, spatialRisk, gap, mode, title, interpretation };
}

function deriveAction(divergence, spatialVerdict, neighborhoodPattern) {
  if (divergence.mode === 'HIDDEN_NEIGHBORHOOD_RISK') {
    return 'Underwriting next step: inspect block trajectory, nearby vacancy reuse, and submarket rent durability before relying on the low document score.';
  }
  if (divergence.mode === 'PROPERTY_SPECIFIC_RISK') {
    return 'Underwriting next step: focus diligence on the parcel itself. Neighborhood context is not the main problem here.';
  }
  if (spatialVerdict === 'ESCALATE') {
    return 'Underwriting next step: require a larger basis discount, tighter contingency plan, or a redevelopment thesis that explicitly absorbs neighborhood distress.';
  }
  if (neighborhoodPattern.label === 'Mixed / transitional block') {
    return 'Underwriting next step: treat the radius as transitional. Price hold risk and inspect whether nearby friction is improving or compounding.';
  }
  return 'Underwriting next step: use the map as confirming evidence and keep diligence focused on deal-specific execution risks.';
}

function buildSummarySentence(metrics, divergence, neighborhoodPattern) {
  const vacancyText = metrics.rawVacancies
    ? `${metrics.rawVacancies} vacanc${metrics.rawVacancies === 1 ? 'y' : 'ies'}, nearest ${metrics.nearestVacancyMeters ?? 'N/A'}m`
    : 'no nearby vacancy hits';
  const complaintText = `${metrics.rawComplaints} complaints`;

  if (divergence.mode === 'PROPERTY_SPECIFIC_RISK') {
    return `Spatial context is cleaner than the document screen. Nearby distress is limited: ${complaintText}, ${vacancyText}.`;
  }
  if (divergence.mode === 'HIDDEN_NEIGHBORHOOD_RISK') {
    return `Spatial context is materially worse than the document screen. The radius shows ${complaintText} and ${vacancyText}.`;
  }
  if (neighborhoodPattern.label === 'Concentrated distress') {
    return `The radius is carrying visible pressure: ${complaintText}, ${vacancyText}, and clustering close enough to matter operationally.`;
  }
  if (neighborhoodPattern.label === 'Mixed / transitional block') {
    return `This address sits in a transitional radius. Activity is present but not uniformly distressed: ${complaintText}, ${vacancyText}.`;
  }
  return `The immediate radius reads clean for Baltimore. The map shows ${complaintText} and ${vacancyText}.`;
}

function summarizeActivityRows(rows, type) {
  return rows.slice(0, 3).map((row) => ({
    type,
    label: type === 'complaint' ? row.serviceName || row.requestType || '311 service request' : row.address || 'Vacant property',
    distance: row.distance,
    ageDays: daysBetween(parseDate(type === 'complaint' ? row.createdDate : row.noticeDate))
  }));
}

async function fetchNearbyComplaints(latitude, longitude, radiusMeters = DEFAULT_RADIUS_METERS) {
  const rows = await prisma.$queryRaw`
    SELECT
      id,
      service_request_num as "requestNum",
      COALESCE(service_name, request_type, description, '311 service request') as "serviceName",
      request_type as "requestType",
      description,
      address,
      COALESCE(status_description, status, 'Open') as "status",
      latitude,
      longitude,
      created_date as "createdDate",
      ST_Distance(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) as "distanceMeters"
    FROM "ServiceRequest"
    WHERE ST_DWithin(
      geom,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${radiusMeters}
    )
    ORDER BY "distanceMeters"
    LIMIT 100
  `;

  return rows.map((row) => {
    const typeWeight = getComplaintTypeWeight(row);
    const recencyWeight = getRecencyWeight(row.createdDate);
    return {
      id: row.id,
      requestNum: row.requestNum,
      serviceName: row.serviceName,
      requestType: row.requestType,
      description: row.description,
      address: row.address,
      status: row.status,
      lat: Number(row.latitude),
      lon: Number(row.longitude),
      distance: Math.round(Number(row.distanceMeters)),
      createdDate: row.createdDate,
      typeWeight,
      recencyWeight,
      severityWeight: round(typeWeight * recencyWeight)
    };
  });
}

async function fetchNearbyVacancies(latitude, longitude, radiusMeters = DEFAULT_RADIUS_METERS) {
  const rows = await prisma.$queryRaw`
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
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) as "distanceMeters"
    FROM "VacantProperty"
    WHERE ST_DWithin(
      geom,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${radiusMeters}
    )
    ORDER BY "distanceMeters"
    LIMIT 50
  `;

  return rows.map((row) => {
    const recencyWeight = getVacancyWeight(row);
    return {
      id: row.id,
      reference: row.reference,
      address: row.address,
      neighborhood: row.neighborhood,
      lat: Number(row.latitude),
      lon: Number(row.longitude),
      distance: Math.round(Number(row.distanceMeters)),
      noticeDate: row.noticeDate,
      recencyWeight
    };
  });
}

async function checkFloodZone(latitude, longitude) {
  try {
    const result = await prisma.$queryRaw`
      SELECT fld_zone as zone
      FROM "FloodZone"
      WHERE ST_Intersects(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      LIMIT 1
    `;

    return result?.length
      ? { inFloodZone: true, floodZoneType: result[0].zone }
      : { inFloodZone: false, floodZoneType: null };
  } catch (error) {
    console.warn('[SpatialRisk] Flood zone query failed:', error.message);
    return { inFloodZone: false, floodZoneType: null, error: error.message };
  }
}

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

    return result?.length
      ? { zoningCode: result[0].zoning_code, zoningDescription: result[0].zoning_description }
      : { zoningCode: null, zoningDescription: null };
  } catch (error) {
    console.warn('[SpatialRisk] Zoning query failed:', error.message);
    return { zoningCode: null, zoningDescription: null, error: error.message };
  }
}

function calculateComplaintDensity(latitude, longitude, radiusMeters = DEFAULT_RADIUS_METERS) {
  return computeSpatialRisk(latitude, longitude, { radiusMeters }).then((result) => result.indicators.complaints);
}

function calculateVacancyExposure(latitude, longitude, radiusMeters = DEFAULT_RADIUS_METERS) {
  return computeSpatialRisk(latitude, longitude, { radiusMeters }).then((result) => result.indicators.vacancy);
}

async function computeSpatialRisk(latitude, longitude, options = {}) {
  if (!latitude || !longitude) {
    return {
      error: 'Missing coordinates',
      spatialRiskScore: null,
      indicators: null
    };
  }

  const radiusMeters = options.radiusMeters || DEFAULT_RADIUS_METERS;
  const [complaintRows, vacancyRows, floodZone, zoning] = await Promise.all([
    fetchNearbyComplaints(latitude, longitude, radiusMeters),
    fetchNearbyVacancies(latitude, longitude, radiusMeters),
    checkFloodZone(latitude, longitude),
    getZoningClassification(latitude, longitude)
  ]);

  const weightedComplaints = round(complaintRows.reduce((sum, row) => sum + row.severityWeight, 0));
  const weightedVacancies = round(vacancyRows.reduce((sum, row) => sum + row.recencyWeight, 0));
  const nearestVacancyMeters = vacancyRows.length ? vacancyRows[0].distance : null;
  const complaintAreaKm2 = Math.PI * Math.pow(radiusMeters / 1000, 2);
  const complaintDensity = complaintAreaKm2 > 0 ? round(weightedComplaints / complaintAreaKm2) : 0;
  const complaintPercentile = estimatePercentile(weightedComplaints, COMPLAINT_PERCENTILE_BANDS);
  const densityPercentile = estimatePercentile(complaintDensity, DENSITY_PERCENTILE_BANDS);
  const vacancyPercentile = estimatePercentile(weightedVacancies, VACANCY_PERCENTILE_BANDS);
  const proximityPercentile = nearestVacancyMeters == null ? 8 : estimatePercentile(radiusMeters - Math.min(radiusMeters, nearestVacancyMeters), PROXIMITY_PERCENTILE_BANDS);

  const complaintScore = Math.min(weightedComplaints / 18, 1);
  const vacancyScore = Math.min(weightedVacancies / 8, 1);
  const proximityScore = nearestVacancyMeters == null ? 0 : Math.min(Math.max((radiusMeters - nearestVacancyMeters) / radiusMeters, 0), 1);
  const floodScore = floodZone.inFloodZone ? 1 : 0;
  const baseScore = complaintScore * 0.35 + vacancyScore * 0.3 + proximityScore * 0.2 + floodScore * 0.15;
  const normalizedScore = Math.round(Math.max(0, Math.min(100, baseScore * 100)));
  const spatialVerdict = deriveSpatialVerdict(normalizedScore);
  const neighborhoodPattern = deriveNeighborhoodPattern({
    weightedComplaints,
    weightedVacancy: weightedVacancies,
    nearestVacancyMeters
  });
  const divergence = deriveDivergence(options.documentRiskScore, normalizedScore);
  const confidence = buildConfidence({
    geocodeSource: options.geocodeSource,
    geocodeConfidence: options.geocodeConfidence,
    complaints: complaintRows,
    vacancies: vacancyRows
  });
  const action = deriveAction(divergence, spatialVerdict, neighborhoodPattern);
  const summarySentence = buildSummarySentence({
    rawComplaints: complaintRows.length,
    rawVacancies: vacancyRows.length,
    nearestVacancyMeters
  }, divergence, neighborhoodPattern);

  return {
    spatialRiskScore: normalizedScore,
    spatialVerdict,
    neighborhoodPattern,
    summarySentence,
    action,
    divergence,
    confidence,
    indicators: {
      complaints: {
        count: complaintRows.length,
        weightedCount: weightedComplaints,
        density: complaintDensity,
        percentile: complaintPercentile,
        densityPercentile,
        bandLabel: getPercentileBandLabel(complaintPercentile),
        radiusMeters,
        topActivity: summarizeActivityRows(complaintRows, 'complaint')
      },
      vacancy: {
        count: vacancyRows.length,
        weightedCount: weightedVacancies,
        percentile: vacancyPercentile,
        proximityPercentile,
        nearestDistanceMeters: nearestVacancyMeters,
        bandLabel: getPercentileBandLabel(vacancyPercentile),
        radiusMeters,
        topActivity: summarizeActivityRows(vacancyRows, 'vacancy')
      },
      floodZone,
      zoning
    },
    weights: {
      complaints: 0.35,
      vacancy: 0.3,
      proximity: 0.2,
      floodZone: 0.15
    },
    baselines: {
      complaintPercentile,
      densityPercentile,
      vacancyPercentile,
      proximityPercentile
    }
  };
}

async function getSpatialContext(latitude, longitude, radiusMeters = DEFAULT_RADIUS_METERS) {
  try {
    const [complaints, vacancies] = await Promise.all([
      fetchNearbyComplaints(latitude, longitude, radiusMeters),
      fetchNearbyVacancies(latitude, longitude, radiusMeters)
    ]);

    return {
      type: 'FeatureCollection',
      features: [
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
        ...complaints.map((row) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [row.lon, row.lat]
          },
          properties: {
            type: 'complaint',
            requestType: row.requestType,
            status: row.status,
            date: row.createdDate
          }
        })),
        ...vacancies.map((row) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [row.lon, row.lat]
          },
          properties: {
            type: 'vacancy',
            address: row.address,
            noticeDate: row.noticeDate
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
  getSpatialContext,
  fetchNearbyComplaints,
  fetchNearbyVacancies
};
