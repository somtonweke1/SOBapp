/**
 * Import Baltimore Spatial Datasets
 * Downloads and loads spatial data from Baltimore Open Data into PostGIS
 */

const { prisma } = require('../src/lib/prisma');
// Using native fetch (Node 18+)

const BALTIMORE_OPEN_DATA_BASE = 'https://data.baltimorecity.gov/resource';

// Baltimore Open Data API endpoints (Socrata format)
const DATASETS = {
  serviceRequests: {
    url: `${BALTIMORE_OPEN_DATA_BASE}/9agw-sxsr.json`,
    table: 'ServiceRequest',
    limit: 5000,
    description: '311 Service Requests with location data'
  },
  vacantBuildings: {
    url: `${BALTIMORE_OPEN_DATA_BASE}/qqcv-ihn5.json`,
    table: 'VacantProperty',
    limit: 2000,
    description: 'Vacant and Abandoned Buildings'
  }
};

/**
 * Fetch data from Baltimore Open Data API
 * @param {string} url - API endpoint
 * @param {number} limit - Maximum records to fetch
 * @returns {Promise<Array>}
 */
async function fetchBaltimoreData(url, limit = 1000) {
  try {
    const fullUrl = `${url}?$limit=${limit}&$order=:id`;
    console.log(`[Import] Fetching from: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Import] Fetched ${data.length} records`);
    return data;
  } catch (error) {
    console.error(`[Import] Failed to fetch data:`, error.message);
    return [];
  }
}

/**
 * Import 311 Service Requests
 */
async function import311ServiceRequests() {
  console.log('\n[Import] Starting 311 Service Requests import...');

  const data = await fetchBaltimoreData(
    DATASETS.serviceRequests.url,
    DATASETS.serviceRequests.limit
  );

  if (data.length === 0) {
    console.log('[Import] No data fetched, skipping import');
    return 0;
  }

  let imported = 0;
  let skipped = 0;

  for (const record of data) {
    try {
      // Check if record has location data
      if (!record.location || !record.location.latitude || !record.location.longitude) {
        skipped++;
        continue;
      }

      const lat = parseFloat(record.location.latitude);
      const lon = parseFloat(record.location.longitude);

      if (isNaN(lat) || isNaN(lon)) {
        skipped++;
        continue;
      }

      // Use raw SQL to insert with PostGIS geometry
      await prisma.$executeRaw`
        INSERT INTO "ServiceRequest" (
          id, request_type, service_request_num, address,
          neighborhood, created_date, updated_date, status, geom
        ) VALUES (
          ${record.servicerequestnum || `sr_${Date.now()}_${Math.random()}`},
          ${record.srtype || 'Unknown'},
          ${record.servicerequestnum},
          ${record.address || null},
          ${record.neighborhood || null},
          ${record.createddate ? new Date(record.createddate) : null},
          ${record.updateddate ? new Date(record.updateddate) : null},
          ${record.srstatus || 'Unknown'},
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)
        )
        ON CONFLICT (id) DO UPDATE SET
          updated_date = EXCLUDED.updated_date,
          status = EXCLUDED.status
      `;

      imported++;

      if (imported % 100 === 0) {
        console.log(`[Import] Imported ${imported} service requests...`);
      }
    } catch (error) {
      console.warn(`[Import] Failed to import record:`, error.message);
      skipped++;
    }
  }

  console.log(`[Import] 311 Service Requests: ${imported} imported, ${skipped} skipped`);
  return imported;
}

/**
 * Import Vacant Properties
 */
async function importVacantProperties() {
  console.log('\n[Import] Starting Vacant Properties import...');

  const data = await fetchBaltimoreData(
    DATASETS.vacantBuildings.url,
    DATASETS.vacantBuildings.limit
  );

  if (data.length === 0) {
    console.log('[Import] No data fetched, skipping import');
    return 0;
  }

  let imported = 0;
  let skipped = 0;

  for (const record of data) {
    try {
      // Check if record has location data
      if (!record.location || !record.location.latitude || !record.location.longitude) {
        skipped++;
        continue;
      }

      const lat = parseFloat(record.location.latitude);
      const lon = parseFloat(record.location.longitude);

      if (isNaN(lat) || isNaN(lon)) {
        skipped++;
        continue;
      }

      await prisma.$executeRaw`
        INSERT INTO "VacantProperty" (
          id, reference_id, address, neighborhood, notice_date, building_type, geom
        ) VALUES (
          ${record.referenceid || `vp_${Date.now()}_${Math.random()}`},
          ${record.referenceid},
          ${record.address || null},
          ${record.neighborhood || null},
          ${record.noticedate ? new Date(record.noticedate) : null},
          ${record.buildingtype || null},
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)
        )
        ON CONFLICT (id) DO UPDATE SET
          notice_date = EXCLUDED.notice_date
      `;

      imported++;

      if (imported % 50 === 0) {
        console.log(`[Import] Imported ${imported} vacant properties...`);
      }
    } catch (error) {
      console.warn(`[Import] Failed to import record:`, error.message);
      skipped++;
    }
  }

  console.log(`[Import] Vacant Properties: ${imported} imported, ${skipped} skipped`);
  return imported;
}

/**
 * Main import function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Baltimore Spatial Data Import');
  console.log('='.repeat(60));

  try {
    // Check PostGIS extension
    const postgisCheck = await prisma.$queryRaw`SELECT PostGIS_Version();`;
    console.log('[Import] PostGIS version:', postgisCheck[0].postgis_version);

    // Import datasets
    const serviceRequestCount = await import311ServiceRequests();
    const vacantPropertyCount = await importVacantProperties();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`Service Requests: ${serviceRequestCount}`);
    console.log(`Vacant Properties: ${vacantPropertyCount}`);
    console.log(`Total: ${serviceRequestCount + vacantPropertyCount}`);

    // Verify counts
    const counts = await prisma.$queryRaw`
      SELECT
        (SELECT COUNT(*) FROM "ServiceRequest") as service_requests,
        (SELECT COUNT(*) FROM "VacantProperty") as vacant_properties
    `;
    console.log('\nDatabase totals:', counts[0]);

  } catch (error) {
    console.error('[Import] Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n[Import] Complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Import] Failed:', error);
      process.exit(1);
    });
}

module.exports = { import311ServiceRequests, importVacantProperties };
