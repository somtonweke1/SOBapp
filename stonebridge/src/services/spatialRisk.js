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
  const text = normalizeServiceText(record.serviceName, record.description);
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

function analyzeTrend(rows, dateField) {
  if (!rows || rows.length < 2) return { direction: 'insufficient_data', confidence: 'low' };

  const withDates = rows
    .map(row => ({ row, date: parseDate(row[dateField]) }))
    .filter(item => item.date !== null)
    .sort((a, b) => a.date - b.date);

  if (withDates.length < 2) return { direction: 'insufficient_data', confidence: 'low' };

  const now = new Date();
  const recent90 = withDates.filter(item => daysBetween(item.date, now) <= 90).length;
  const days90to365 = withDates.filter(item => {
    const days = daysBetween(item.date, now);
    return days > 90 && days <= 365;
  }).length;
  const olderThan365 = withDates.filter(item => daysBetween(item.date, now) > 365).length;

  const recentRate = recent90 / Math.max(1, recent90 + days90to365 + olderThan365);
  const middleRate = days90to365 / Math.max(1, recent90 + days90to365 + olderThan365);

  let direction = 'stable';
  let confidence = 'medium';
  let description = '';

  if (recentRate > 0.5) {
    direction = 'accelerating';
    confidence = recent90 >= 5 ? 'high' : 'medium';
    description = `Activity is accelerating—${recent90} of ${withDates.length} events occurred in the last 90 days. This suggests worsening neighborhood pressure.`;
  } else if (recentRate < 0.15 && olderThan365 > recent90 + days90to365) {
    direction = 'improving';
    confidence = olderThan365 >= 5 ? 'high' : 'medium';
    description = `Activity is declining—most events are older than 1 year. This suggests neighborhood conditions may be stabilizing.`;
  } else {
    direction = 'stable';
    description = `Activity is relatively steady over time. No clear acceleration or decline pattern detected.`;
  }

  return { direction, confidence, description, recent90, days90to365, olderThan365 };
}

function deriveNeighborhoodPattern(metrics, complaintTrend, vacancyTrend) {
  const baseDistress = metrics.weightedVacancy >= 6 || metrics.weightedComplaints >= 18 ||
    (metrics.nearestVacancyMeters && metrics.nearestVacancyMeters < 120);
  const baseTransitional = metrics.weightedComplaints >= 7 || metrics.weightedVacancy >= 2 ||
    (metrics.nearestVacancyMeters && metrics.nearestVacancyMeters < 220);

  let label = 'Clean radius';
  let description = 'Immediate block conditions look materially cleaner than a distressed Baltimore radius.';
  let trendModifier = '';

  if (baseDistress) {
    label = 'Concentrated distress';
    description = 'Complaint and vacancy pressure are clustering close enough to affect the underwriting story.';

    if (complaintTrend?.direction === 'accelerating' || vacancyTrend?.direction === 'accelerating') {
      trendModifier = ' Pattern is accelerating—recent activity suggests conditions are deteriorating.';
      label = 'Concentrated distress (worsening)';
    } else if (complaintTrend?.direction === 'improving' && vacancyTrend?.direction !== 'accelerating') {
      trendModifier = ' Some signs of stabilization—recent activity is lighter than historical baseline.';
    }
  } else if (baseTransitional) {
    label = 'Mixed / transitional block';
    description = 'The radius is investable in places, but nearby friction is visible and should be priced explicitly.';

    if (complaintTrend?.direction === 'improving' && vacancyTrend?.direction === 'improving') {
      trendModifier = ' Improving trajectory—recent activity suggests the block may be turning.';
      label = 'Mixed / transitional block (improving)';
    } else if (complaintTrend?.direction === 'accelerating' || vacancyTrend?.direction === 'accelerating') {
      trendModifier = ' Deteriorating trajectory—watch for cascading distress.';
      label = 'Mixed / transitional block (declining)';
    }
  } else {
    if (complaintTrend?.direction === 'accelerating' && complaintTrend.recent90 >= 3) {
      trendModifier = ' Watch for emerging pressure—complaint activity has picked up recently.';
      label = 'Clean radius (monitor)';
    }
  }

  return {
    label,
    description: description + trendModifier,
    trend: {
      complaint: complaintTrend,
      vacancy: vacancyTrend
    }
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
  const actions = [];
  const isWorsening = neighborhoodPattern.label?.includes('worsening') || neighborhoodPattern.label?.includes('declining');
  const isImproving = neighborhoodPattern.label?.includes('improving');
  const complaintAccelerating = neighborhoodPattern.trend?.complaint?.direction === 'accelerating';
  const vacancyAccelerating = neighborhoodPattern.trend?.vacancy?.direction === 'accelerating';

  // Primary action based on divergence
  if (divergence.mode === 'HIDDEN_NEIGHBORHOOD_RISK') {
    actions.push('⚠️ Priority: Inspect block trajectory and nearby vacancy reuse before relying on the low document score.');
    if (isWorsening) {
      actions.push('📉 Trend Alert: Recent activity shows deterioration—verify if this is temporary construction noise or structural decline.');
    }
    actions.push('💰 Pricing: Require submarket rent durability analysis and larger contingency reserves.');
  } else if (divergence.mode === 'PROPERTY_SPECIFIC_RISK') {
    actions.push('🎯 Focus diligence on the parcel itself—neighborhood context is cleaner than property signals suggest.');
    actions.push('🔍 Deep dive: Property-specific issues (title, violations, liens) need resolution. Block is investable.');
  } else if (spatialVerdict === 'ESCALATE') {
    actions.push('🚨 High Risk: Require larger basis discount, tighter contingency plan, or redevelopment thesis that explicitly absorbs neighborhood distress.');
    if (isWorsening) {
      actions.push('📊 Deteriorating conditions detected—consider shorter hold period or exit strategy that accounts for continued decline.');
    } else if (isImproving) {
      actions.push('📈 Some stabilization detected—verify if improvement is durable and captured in comps before underwriting recovery.');
    }
  } else if (neighborhoodPattern.label?.includes('Mixed / transitional')) {
    actions.push('⚖️ Transitional Block: Price hold risk and inspect whether nearby friction is improving or compounding.');
    if (isImproving) {
      actions.push('✅ Improving trend—this could be an opportunity if basis is right and you can wait for the turn.');
    } else if (isWorsening) {
      actions.push('⚠️ Deteriorating trend—tighten underwriting assumptions and stress-test downside scenarios.');
    }
  } else {
    actions.push('✓ Spatial context supports the deal. Use map as confirming evidence.');
    if (complaintAccelerating) {
      actions.push('👀 Monitor: Complaint activity picking up—track this in ongoing asset management.');
    }
  }

  // Secondary tactical actions
  if (vacancyAccelerating && neighborhoodPattern.trend.vacancy.recent90 >= 3) {
    actions.push('🏚️ Vacancy Alert: 3+ new vacancies in 90 days—confirm this isn\'t spillover from adjacent distressed corridors.');
  }

  if (divergence.spatialRisk >= 50 || spatialVerdict === 'ESCALATE') {
    actions.push('📋 Due Diligence: Site visit required. Walk the block, photograph nearest vacancies, talk to neighbors.');
  }

  return actions.join(' ');
}

function buildSummarySentence(metrics, divergence, neighborhoodPattern) {
  const vacancyText = metrics.rawVacancies
    ? `${metrics.rawVacancies} vacanc${metrics.rawVacancies === 1 ? 'y' : 'ies'}, nearest ${metrics.nearestVacancyMeters ?? 'N/A'}m`
    : 'no nearby vacancy hits';
  const complaintText = `${metrics.rawComplaints} complaints`;

  // Add trend context
  let trendContext = '';
  const complaintTrend = neighborhoodPattern.trend?.complaint;
  const vacancyTrend = neighborhoodPattern.trend?.vacancy;

  if (complaintTrend?.direction === 'accelerating') {
    trendContext = ` Recent complaint activity is accelerating (${complaintTrend.recent90} in last 90 days).`;
  } else if (complaintTrend?.direction === 'improving') {
    trendContext = ` Complaint activity is declining—most events are historical.`;
  }

  if (vacancyTrend?.direction === 'accelerating' && vacancyTrend.recent90 >= 2) {
    trendContext += ` Vacancy notices accelerating (${vacancyTrend.recent90} recent).`;
  } else if (vacancyTrend?.direction === 'improving') {
    trendContext += ` Vacancy trend improving—most notices are old.`;
  }

  let baseSentence = '';
  if (divergence.mode === 'PROPERTY_SPECIFIC_RISK') {
    baseSentence = `Spatial context is cleaner than the document screen. Nearby distress is limited: ${complaintText}, ${vacancyText}.`;
  } else if (divergence.mode === 'HIDDEN_NEIGHBORHOOD_RISK') {
    baseSentence = `Spatial context is materially worse than the document screen. The radius shows ${complaintText} and ${vacancyText}.`;
  } else if (neighborhoodPattern.label?.includes('Concentrated distress')) {
    baseSentence = `The radius is carrying visible pressure: ${complaintText}, ${vacancyText}, and clustering close enough to matter operationally.`;
  } else if (neighborhoodPattern.label?.includes('Mixed / transitional')) {
    baseSentence = `This address sits in a transitional radius. Activity is present but not uniformly distressed: ${complaintText}, ${vacancyText}.`;
  } else {
    baseSentence = `The immediate radius reads clean for Baltimore. The map shows ${complaintText} and ${vacancyText}.`;
  }

  return baseSentence + trendContext;
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
      COALESCE(service_name, description, '311 service request') as "serviceName",
      description,
      address,
      COALESCE(status_description, 'Open') as "status",
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

  // Analyze temporal trends
  const complaintTrend = analyzeTrend(complaintRows, 'createdDate');
  const vacancyTrend = analyzeTrend(vacancyRows, 'noticeDate');

  const neighborhoodPattern = deriveNeighborhoodPattern({
    weightedComplaints,
    weightedVacancy: weightedVacancies,
    nearestVacancyMeters
  }, complaintTrend, vacancyTrend);
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
            requestType: row.serviceName,
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
