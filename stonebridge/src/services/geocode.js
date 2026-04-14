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

function normalizeStreetAddress(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function buildStreetCandidates(address) {
  const normalized = normalizeStreetAddress(address);
  const firstSegment = normalized.split(',')[0].trim();
  const withoutBaltimore = firstSegment
    .replace(/\bBaltimore\b/i, '')
    .replace(/\bMaryland\b/i, '')
    .replace(/\bMD\b/i, '')
    .replace(/\bUSA\b/i, '')
    .replace(/\b\d{5}(?:-\d{4})?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return [...new Set([normalized, firstSegment, withoutBaltimore].filter(Boolean))];
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
          WHERE UPPER(TRIM(address)) = UPPER(TRIM(${candidate}))
          UNION ALL
          SELECT
            'ServiceRequest' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            2 AS priority
          FROM "ServiceRequest"
          WHERE UPPER(TRIM(address)) = UPPER(TRIM(${candidate}))
          UNION ALL
          SELECT
            'VacantProperty' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            3 AS priority
          FROM "VacantProperty"
          WHERE UPPER(TRIM(address)) = UPPER(TRIM(${candidate}))
          UNION ALL
          SELECT
            'Parcel' AS source,
            address,
            ST_Y(ST_Centroid(geom)) AS latitude,
            ST_X(ST_Centroid(geom)) AS longitude,
            4 AS priority
          FROM "Parcel"
          WHERE UPPER(address) LIKE UPPER(${candidate + '%'})
          UNION ALL
          SELECT
            'ServiceRequest' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            5 AS priority
          FROM "ServiceRequest"
          WHERE UPPER(address) LIKE UPPER(${candidate + '%'})
          UNION ALL
          SELECT
            'VacantProperty' AS source,
            address,
            ST_Y(geom) AS latitude,
            ST_X(geom) AS longitude,
            6 AS priority
          FROM "VacantProperty"
          WHERE UPPER(address) LIKE UPPER(${candidate + '%'})
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
          source: `local:${match.source}`
        };
      }
    } catch (error) {
      console.warn(`[Geocoding] Local dataset lookup failed for "${candidate}": ${error.message}`);
    }
  }

  return null;
}

/**
 * Geocode a Baltimore address to coordinates
 * @param {string} address - Street address
 * @param {string} city - City (default: Baltimore)
 * @param {string} state - State (default: MD)
 * @returns {Promise<{latitude: number, longitude: number} | null>}
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

    // Validate coordinates are in Baltimore area
    // Baltimore bounds: ~39.2-39.4°N, -76.7--76.5°W
    const lat = result.latitude;
    const lon = result.longitude;

    if (lat < 39.15 || lat > 39.45 || lon < -76.75 || lon > -76.45) {
      console.warn(`[Geocoding] Coordinates outside Baltimore: ${lat}, ${lon}`);
      // Return anyway but log warning
    }

    console.log(`[Geocoding] Success: ${lat}, ${lon}`);

    return {
      latitude: lat,
      longitude: lon,
      formattedAddress: result.formattedAddress,
      confidence: result.extra?.confidence || 'unknown',
      source: 'remote:openstreetmap'
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
};
