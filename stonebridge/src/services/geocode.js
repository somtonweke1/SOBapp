/**
 * Geocoding Service
 * Converts Baltimore addresses to lat/lon coordinates using OpenStreetMap Nominatim
 */

const NodeGeocoder = require('node-geocoder');

// Configure geocoder to use OpenStreetMap (free, no API key required)
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null,
  timeout: 5000,
});

/**
 * Geocode a Baltimore address to coordinates
 * @param {string} address - Street address
 * @param {string} city - City (default: Baltimore)
 * @param {string} state - State (default: MD)
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function geocodeAddress(address, city = 'Baltimore', state = 'MD') {
  try {
    const fullAddress = `${address}, ${city}, ${state}`;

    console.log(`[Geocoding] ${fullAddress}`);

    const results = await geocoder.geocode(fullAddress);

    if (!results || results.length === 0) {
      console.warn(`[Geocoding] No results for: ${fullAddress}`);
      return null;
    }

    const result = results[0];

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
async function geocodeBatch(addresses) {
  const results = [];

  for (const addr of addresses) {
    const result = await geocodeAddress(addr.address, addr.city, addr.state);

    results.push(result ? {
      address: addr.address,
      ...result,
    } : null);

    // Rate limiting: wait 1 second between requests (Nominatim usage policy)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

module.exports = {
  geocodeAddress,
  geocodeBatch,
};
