const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function setupPostGIS() {
  console.log('Setting up PostGIS on Neon PostgreSQL...\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✓ Connected to Neon PostgreSQL\n');

    // Execute SQL statements in proper logical blocks
    const statements = [
      // Step 1: Enable PostGIS
      `CREATE EXTENSION IF NOT EXISTS postgis;`,

      // Step 2: Add spatial column to Deal table
      `DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Deal' AND column_name = 'geom'
    ) THEN
        ALTER TABLE "Deal"
        ADD COLUMN geom geometry(Point, 4326);

        CREATE INDEX IF NOT EXISTS "Deal_geom_idx"
        ON "Deal" USING GIST (geom);

        RAISE NOTICE 'Added geom column and spatial index to Deal table';
    ELSE
        RAISE NOTICE 'Deal.geom column already exists';
    END IF;
END $$;`,

      // Step 3: Create trigger function
      `CREATE OR REPLACE FUNCTION update_deal_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.geom := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,

      // Step 3b: Create trigger
      `DROP TRIGGER IF EXISTS deal_geom_trigger ON "Deal";`,
      `CREATE TRIGGER deal_geom_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION update_deal_geom();`,

      // Step 4: Create ServiceRequest table
      `CREATE TABLE IF NOT EXISTS "ServiceRequest" (
    id TEXT PRIMARY KEY,
    service_request_num TEXT UNIQUE NOT NULL,
    status_code TEXT,
    status_description TEXT,
    agency_name TEXT,
    service_name TEXT,
    service_code TEXT,
    description TEXT,
    address TEXT,
    zipcode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom geometry(Point, 4326),
    created_date TIMESTAMP,
    updated_date TIMESTAMP,
    due_date TIMESTAMP,
    closed_date TIMESTAMP,
    imported_at TIMESTAMP DEFAULT NOW()
);`,
      `CREATE INDEX IF NOT EXISTS "ServiceRequest_geom_idx" ON "ServiceRequest" USING GIST (geom);`,
      `CREATE INDEX IF NOT EXISTS "ServiceRequest_created_date_idx" ON "ServiceRequest" (created_date);`,

      // Step 5: Create VacantProperty table
      `CREATE TABLE IF NOT EXISTS "VacantProperty" (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    block TEXT,
    lot TEXT,
    address TEXT,
    zipcode TEXT,
    neighborhood TEXT,
    police_district TEXT,
    council_district TEXT,
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom geometry(Point, 4326),
    notice_date TIMESTAMP,
    building_address TEXT,
    imported_at TIMESTAMP DEFAULT NOW()
);`,
      `CREATE INDEX IF NOT EXISTS "VacantProperty_geom_idx" ON "VacantProperty" USING GIST (geom);`,

      // Step 6: Create Zoning table
      `CREATE TABLE IF NOT EXISTS "Zoning" (
    id TEXT PRIMARY KEY,
    zone_code TEXT NOT NULL,
    zone_class TEXT,
    label TEXT,
    geom geometry(MultiPolygon, 4326),
    imported_at TIMESTAMP DEFAULT NOW()
);`,
      `CREATE INDEX IF NOT EXISTS "Zoning_geom_idx" ON "Zoning" USING GIST (geom);`,

      // Step 7: Create FloodZone table
      `CREATE TABLE IF NOT EXISTS "FloodZone" (
    id TEXT PRIMARY KEY,
    fld_zone TEXT NOT NULL,
    fld_ar_id TEXT,
    zone_subty TEXT,
    static_bfe DOUBLE PRECISION,
    geom geometry(MultiPolygon, 4326),
    imported_at TIMESTAMP DEFAULT NOW()
);`,
      `CREATE INDEX IF NOT EXISTS "FloodZone_geom_idx" ON "FloodZone" USING GIST (geom);`,

      // Step 8: Create Parcel table
      `CREATE TABLE IF NOT EXISTS "Parcel" (
    id TEXT PRIMARY KEY,
    pin TEXT UNIQUE NOT NULL,
    block TEXT,
    lot TEXT,
    ward TEXT,
    section TEXT,
    address TEXT,
    zipcode TEXT,
    owner_name TEXT,
    owner_abbr TEXT,
    use_code TEXT,
    zoning TEXT,
    city_owned BOOLEAN,
    geom geometry(MultiPolygon, 4326),
    imported_at TIMESTAMP DEFAULT NOW()
);`,
      `CREATE INDEX IF NOT EXISTS "Parcel_geom_idx" ON "Parcel" USING GIST (geom);`,

      // Step 9: Backfill existing deals
      `UPDATE "Deal"
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND geom IS NULL;`
    ];

    console.log(`Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await prisma.$executeRawUnsafe(statement);
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (error) {
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✗ [${i + 1}/${statements.length}] ${preview}...`);
        console.log(`  Error: ${error.message}`);

        // Continue on errors - some might be expected (e.g., extension already exists)
        if (error.message.includes('already exists')) {
          console.log(`  (Continuing - already exists)`);
        }
      }
    }

    // Verify PostGIS is installed
    console.log('\n=== Verification ===\n');

    try {
      const result = await prisma.$queryRaw`SELECT PostGIS_version();`;
      console.log('✓ PostGIS version:', result[0].postgis_version);
    } catch (error) {
      console.log('✗ PostGIS not available:', error.message);
    }

    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('ServiceRequest', 'VacantProperty', 'Zoning', 'FloodZone', 'Parcel', 'Deal')
      ORDER BY table_name;
    `;
    console.log('\n✓ Spatial tables created:', tables.map(t => t.table_name).join(', '));

    // Check spatial column on Deal
    const dealGeom = await prisma.$queryRaw`
      SELECT column_name, udt_name
      FROM information_schema.columns
      WHERE table_name = 'Deal' AND column_name = 'geom';
    `;
    if (dealGeom.length > 0) {
      console.log('✓ Deal.geom column exists');
    } else {
      console.log('✗ Deal.geom column missing');
    }

    // Count existing deals with geometry
    const dealCount = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        COUNT(geom) as with_geom
      FROM "Deal";
    `;
    console.log(`✓ Deal records: ${dealCount[0].total} total, ${dealCount[0].with_geom} with geometry\n`);

    console.log('=== PostGIS Setup Complete ===');
    console.log('\nNext steps:');
    console.log('1. Update Railway environment variables to use Neon');
    console.log('2. Run: node scripts/importSpatialData.js');
    console.log('3. Deploy to Railway');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setupPostGIS();
