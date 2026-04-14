/**
 * Geocoding Service
 * Converts Baltimore addresses to lat/lon coordinates using OpenStreetMap Nominatim
 */

const NodeGeocoder = require('node-geocoder');
const { prisma } = require('../lib/prisma');

// Configure geocoder to use OpenStreetMap (free, no API key required)
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null,
  timeout: 5000,
});

const STREET_SUFFIX_MAP = new Map([
  ['street', 'st'],
  ['st', 'st'],
  ['avenue', 'ave'],
  ['ave', 'ave'],
  ['road', 'rd'],
  ['rd', 'rd'],
  ['boulevard', 'blvd'],
  ['blvd', 'blvd'],
  ['place', 'pl'],
  ['pl', 'pl'],
  ['drive', 'dr'],
  ['dr', 'dr'],
  ['court', 'ct'],
  ['ct', 'ct'],
  ['lane', 'ln'],
  ['ln', 'ln'],
  ['terrace', 'ter'],
  ['ter', 'ter'],
  ['parkway', 'pkwy'],
  ['pkwy', 'pkwy'],
  ['highway', 'hwy'],
  ['hwy', 'hwy']
]);

const DIRECTION_MAP = new Map([
  ['north', 'n'],
  ['south', 's'],
  ['east', 'e'],
  ['west', 'w'],
  ['northeast', 'ne'],
  ['northwest', 'nw'],
  ['southeast', 'se'],
  ['southwest', 'sw'],
  ['n', 'n'],
  ['s', 's'],
  ['e', 'e'],
  ['w', 'w'],
  ['ne', 'ne'],
  ['nw', 'nw'],
  ['se', 'se'],
  ['sw', 'sw']
]);

function normalizeToken(token) {
  const cleaned = String(token || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleaned) return '';
  if (DIRECTION_MAP.has(cleaned)) return DIRECTION_MAP.get(cleaned);
  if (STREET_SUFFIX_MAP.has(cleaned)) return STREET_SUFFIX_MAP.get(cleaned);
  return cleaned;
}

function stripSecondaryUnit(value) {
  return String(value || '')
    .replace(/\b(?:apt|apartment|unit|ste|suite|fl|floor|rm|room)\b[\s#-]*[a-z0-9-]+/gi, '')
    .replace(/\s+#\s*[a-z0-9-]+/gi, '')
    .trim();
}

function normalizeStreetAddress(value) {
  const withoutUnits = stripSecondaryUnit(value);
  return withoutUnits
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/,/g, ' ')
    .replace(/\b212\d{2}(?:-\d{4})?\b/g, '')
    .replace(/\b(baltimore|maryland|md|usa)\b/gi, '')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function toCanonicalStreet(value) {
  const tokens = normalizeStreetAddress(value)
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
  return tokens.join(' ');
}

function buildStreetCandidates(address) {
  const normalized = normalizeStreetAddress(address);
  const firstSegment = normalized.split(',')[0].trim() || normalized;
  const canonical = toCanonicalStreet(firstSegment);
  const tokens = canonical.split(' ').filter(Boolean);
  const withoutDirectional = tokens.length > 2 && DIRECTION_MAP.has(tokens[1])
    ? [tokens[0], ...tokens.slice(2)].join(' ')
    : '';
  const withoutSuffix = tokens.length > 2 && STREET_SUFFIX_MAP.has(tokens[tokens.length - 1])
    ? tokens.slice(0, -1).join(' ')
    : '';

  return [...new Set([
    normalized,
    firstSegment,
    canonical,
    withoutDirectional,
    withoutSuffix
  ].filter(Boolean))];
}

async function geocodeFromLocalDatasets(address) {
  const candidates = buildStreetCandidates(address);

  for (const candidate of candidates) {
    try {
      const rows = await prisma.$queryRaw`
        WITH address_candidates AS (
          SELECT
            'Parcel' AS source,
            address,
            ST_Y(ST_Centroid(geom)) AS latitude,
            ST_X(ST_Centroid(geom)) AS longitude,
            1 AS priority
          FROM "Parcel"
          WHERE regexp_replace(lower(address), '[^a-z0-9]+', ' ', 'g') = regexp_replace(lower(${candidate}), '[^a-z0-9]+', ' ', 'g')
          UNION ALL
          SELECT
            'ServiceRequest' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            2 AS priority
          FROM "ServiceRequest"
          WHERE regexp_replace(lower(address), '[^a-z0-9]+', ' ', 'g') = regexp_replace(lower(${candidate}), '[^a-z0-9]+', ' ', 'g')
          UNION ALL
          SELECT
            'VacantProperty' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            3 AS priority
          FROM "VacantProperty"
          WHERE regexp_replace(lower(address), '[^a-z0-9]+', ' ', 'g') = regexp_replace(lower(${candidate}), '[^a-z0-9]+', ' ', 'g')
          UNION ALL
          SELECT
            'Parcel' AS source,
            address,
            ST_Y(ST_Centroid(geom)) AS latitude,
            ST_X(ST_Centroid(geom)) AS longitude,
            4 AS priority
          FROM "Parcel"
          WHERE regexp_replace(lower(address), '[^a-z0-9]+', ' ', 'g') LIKE regexp_replace(lower(${candidate + '%'}), '[^a-z0-9]+', ' ', 'g')
          UNION ALL
          SELECT
            'ServiceRequest' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            5 AS priority
          FROM "ServiceRequest"
          WHERE regexp_replace(lower(address), '[^a-z0-9]+', ' ', 'g') LIKE regexp_replace(lower(${candidate + '%'}), '[^a-z0-9]+', ' ', 'g')
          UNION ALL
          SELECT
            'VacantProperty' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            6 AS priority
          FROM "VacantProperty"
          WHERE regexp_replace(lower(address), '[^a-z0-9]+', ' ', 'g') LIKE regexp_replace(lower(${candidate + '%'}), '[^a-z0-9]+', ' ', 'g')
        )
        SELECT source, address, latitude, longitude, priority
        FROM address_candidates
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY priority, LENGTH(address)
        LIMIT 1
      `;

      if (rows?.length) {
        const match = rows[0];
        return {
          latitude: Number(match.latitude),
          longitude: Number(match.longitude),
          formattedAddress: match.address,
          confidence: match.priority <= 3 ? 'high' : 'medium',
          source: `local:${match.source}`,
          coverage: match.priority <= 3 ? 'exact' : 'prefix'
        };
      }
    } catch (error) {
      // Log specific error types for debugging
      if (error.code === 'P2024') {
        console.error('[Geocoding] Database connection timeout - PostGIS may be unavailable');
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error('[Geocoding] Missing database table - schema migration may be needed');
      } else if (error.message?.includes('ST_')) {
        console.error('[Geocoding] PostGIS function error - PostGIS extension may not be enabled');
      } else {
        console.warn(`[Geocoding] Local dataset lookup failed for "${candidate}": ${error.message}`);
      }
      // Continue to next candidate rather than failing completely
    }
  }

  return null; // All local candidates exhausted, caller will fallback to remote geocoder
}

/**
 * Snaps coordinates to nearest parcel centroid if within tolerance distance.
 * Improves accuracy by correcting geocoder drift to actual property boundaries.
 * @param {number} latitude - Input latitude
 * @param {number} longitude - Input longitude
 * @param {number} toleranceMeters - Maximum distance to snap (default: 50m)
 * @returns {Promise<{latitude: number, longitude: number, snapped: boolean, distance?: number} | null>}
 */
async function snapToNearestParcel(latitude, longitude, toleranceMeters = 50) {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        address,
        ST_Y(ST_Centroid(geom)) AS parcel_lat,
        ST_X(ST_Centroid(geom)) AS parcel_lon,
        ST_Distance(
          geom,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) AS distance_meters
      FROM "Parcel"
      WHERE ST_DWithin(
        geom,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${toleranceMeters}
      )
      ORDER BY distance_meters
      LIMIT 1
    `;

    if (result && result.length > 0) {
      const parcel = result[0];
      const distance = Math.round(Number(parcel.distance_meters));
      console.log(`[Geocoding] Snapped to parcel "${parcel.address}" (${distance}m away)`);
      return {
        latitude: Number(parcel.parcel_lat),
        longitude: Number(parcel.parcel_lon),
        snapped: true,
        distance,
        parcelAddress: parcel.address
      };
    }

    return { latitude, longitude, snapped: false };
  } catch (error) {
    console.warn('[Geocoding] Parcel snapping failed:', error.message);
    return { latitude, longitude, snapped: false };
  }
}

/**
 * Geocode a Baltimore address to coordinates with validation and parcel snapping
 * @param {string} address - Street address
 * @param {string} city - City (default: Baltimore)
 * @param {string} state - State (default: MD)
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string, confidence: string, source: string} | null>}
 */
async function geocodeAddress(address, city = 'Baltimore', state = 'MD') {
  try {
    const normalizedAddress = normalizeStreetAddress(address);
    const fullAddress = `${normalizedAddress}, ${city}, ${state}`;
    const localMatch = await geocodeFromLocalDatasets(normalizedAddress);

    if (localMatch) {
      console.log(`[Geocoding] Local match via ${localMatch.source}: ${localMatch.latitude}, ${localMatch.longitude}`);
      return localMatch;
    }

    const lookupQueries = [...new Set([
      fullAddress,
      `${normalizedAddress}, Baltimore, Maryland`,
      `${normalizedAddress}, Baltimore City, Maryland, USA`,
      normalizedAddress
    ])];

    console.log(`[Geocoding] Queries: ${lookupQueries.join(' | ')}`);

    let result = null;
    for (const query of lookupQueries) {
      const results = await geocoder.geocode(query);
      if (results && results.length > 0) {
        result = results[0];
        break;
      }
    }

    if (!result) {
      console.warn(`[Geocoding] No results for: ${fullAddress}`);
      return null;
    }

    // CRITICAL: Validate coordinates are in Baltimore City bounds
    // Baltimore City bounds: ~39.197-39.372°N, -76.711--76.529°W
    const lat = result.latitude;
    const lon = result.longitude;

    if (lat < 39.15 || lat > 39.45 || lon < -76.75 || lon > -76.45) {
      console.error(`[Geocoding] REJECTED: Coordinates outside Baltimore bounds: ${lat}, ${lon} for address "${fullAddress}"`);
      console.error('[Geocoding] This may be a different city with the same street name. Verify address includes "Baltimore, MD".');
      return null; // REJECT rather than return wrong coordinates
    }

    console.log(`[Geocoding] Remote geocoder success: ${lat}, ${lon}`);

    // Attempt to snap to nearest parcel for improved accuracy
    const snapped = await snapToNearestParcel(lat, lon, 50);

    return {
      latitude: snapped.latitude,
      longitude: snapped.longitude,
      formattedAddress: snapped.snapped ? snapped.parcelAddress : result.formattedAddress,
      confidence: snapped.snapped ? 'medium' : (result.extra?.confidence || 'low'),
      source: snapped.snapped ? 'remote:openstreetmap+parcel-snapped' : 'remote:openstreetmap',
      coverage: 'remote',
      snappedDistance: snapped.snapped ? snapped.distance : null
    };
  } catch (error) {
    console.error(`[Geocoding] Error for ${address}:`, error.message);
    return null;
  }
}

/**
 * Batch geocode multiple addresses
 * @param {Array<{address: string, city: string, state: string}>} addresses
 * @returns {Promise<Array<{address: string, latitude: number, longitude: number} | null>>}
 */
/** Geocodes multiple addresses sequentially with rate limiting and error tracking. */
async function geocodeBatch(addresses) {
  const results = [];
  const errors = [];

  for (const addr of addresses) {
    const result = await geocodeAddress(addr.address, addr.city, addr.state);

    if (result) {
      results.push({
        address: addr.address,
        ...result,
      });
    } else {
      results.push(null);
      errors.push({
        address: addr.address,
        city: addr.city,
        state: addr.state,
        error: 'Geocoding failed - address not found or API error'
      });
    }

    // Rate limiting: wait 1 second between requests (Nominatim usage policy)
    if (addresses.indexOf(addr) < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return {
    results,
    errors,
    successCount: results.filter(r => r !== null).length,
    failureCount: errors.length,
    total: addresses.length
  };
}

module.exports = {
  geocodeAddress,
  geocodeBatch,
  normalizeStreetAddress,
};
