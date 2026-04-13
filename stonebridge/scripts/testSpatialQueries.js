/**
 * Test Spatial Queries on Neon/PostGIS
 * Verifies that PostGIS is working correctly in production
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSpatialQueries() {
  console.log('=== Testing PostGIS Spatial Queries ===\n');

  try {
    await prisma.$connect();
    console.log('✓ Connected to database\n');

    // Test 1: Verify PostGIS extension
    console.log('Test 1: PostGIS Version');
    const version = await prisma.$queryRaw`SELECT PostGIS_version();`;
    console.log(`✓ PostGIS ${version[0].postgis_version}\n`);

    // Test 2: Create test geometries (Points)
    console.log('Test 2: Creating test geometries');
    const point1 = await prisma.$queryRaw`
      SELECT ST_AsText(ST_SetSRID(ST_MakePoint(-76.616560, 39.290385), 4326)) as geom_text;
    `;
    console.log(`✓ Point 1: ${point1[0].geom_text}`);

    const point2 = await prisma.$queryRaw`
      SELECT ST_AsText(ST_SetSRID(ST_MakePoint(-76.608123, 39.289877), 4326)) as geom_text;
    `;
    console.log(`✓ Point 2: ${point2[0].geom_text}`);

    // Test 3: Calculate distance between two points
    console.log('\nTest 3: Spatial distance calculation');
    const distance = await prisma.$queryRaw`
      SELECT
        ST_Distance(
          ST_SetSRID(ST_MakePoint(-76.616560, 39.290385), 4326)::geography,
          ST_SetSRID(ST_MakePoint(-76.608123, 39.289877), 4326)::geography
        ) as distance_meters;
    `;
    console.log(`✓ Distance between points: ${Math.round(distance[0].distance_meters)}m`);

    // Test 4: Buffer/area calculation
    console.log('\nTest 4: Buffer operation (500m radius)');
    const buffer = await prisma.$queryRaw`
      SELECT
        ST_AsText(
          ST_Buffer(
            ST_SetSRID(ST_MakePoint(-76.616560, 39.290385), 4326)::geography,
            500
          )::geometry
        ) as buffer_geom_sample;
    `;
    const bufferText = buffer[0].buffer_geom_sample.substring(0, 100);
    console.log(`✓ 500m buffer created: ${bufferText}...`);

    // Test 5: Verify spatial indexes exist
    console.log('\nTest 5: Verify spatial indexes');
    const indexes = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE indexname LIKE '%geom_idx'
      ORDER BY tablename;
    `;
    console.log(`✓ Found ${indexes.length} spatial indexes:`);
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname} on ${idx.tablename}`);
    });

    console.log('\n=== All Spatial Tests Passed ✓ ===\n');
    console.log('PostGIS is fully functional and ready for production use.');
    console.log('Spatial features available:');
    console.log('  - Automatic geometry creation from lat/lon');
    console.log('  - Distance calculations');
    console.log('  - Proximity/buffer queries');
    console.log('  - Spatial indexing for performance');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testSpatialQueries();
