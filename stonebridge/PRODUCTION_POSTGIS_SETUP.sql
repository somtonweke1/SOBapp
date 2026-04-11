-- ============================================================================
-- STONEBRIDGE PRODUCTION POSTGIS SETUP FOR SUPABASE
-- ============================================================================
-- Execute this script in your Supabase SQL Editor to enable GIS features
-- Required before running the application migrations
-- ============================================================================

-- Step 1: Enable PostGIS Extension
-- This adds spatial data types and functions to your database
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS version (should be 3.x)
SELECT PostGIS_Version();

-- ============================================================================
-- Step 2: Add Spatial Column to Deal Table
-- ============================================================================
-- Add geometry column to existing Deal table (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Deal' AND column_name = 'geom'
    ) THEN
        ALTER TABLE "Deal"
        ADD COLUMN geom geometry(Point, 4326);

        -- Create spatial index for performance
        CREATE INDEX IF NOT EXISTS "Deal_geom_idx"
        ON "Deal" USING GIST (geom);

        RAISE NOTICE 'Added geom column and spatial index to Deal table';
    ELSE
        RAISE NOTICE 'Deal.geom column already exists';
    END IF;
END $$;

-- ============================================================================
-- Step 3: Create Trigger to Auto-Update Geometry from Lat/Lon
-- ============================================================================
-- This trigger automatically populates the geom column when latitude/longitude are set

CREATE OR REPLACE FUNCTION update_deal_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.geom := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS deal_geom_trigger ON "Deal";
CREATE TRIGGER deal_geom_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON "Deal"
FOR EACH ROW
EXECUTE FUNCTION update_deal_geom();

-- ============================================================================
-- Step 4: Create Spatial Data Tables
-- ============================================================================

-- Service Requests (311 Complaints)
CREATE TABLE IF NOT EXISTS "ServiceRequest" (
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
);

-- Spatial index for ServiceRequest
CREATE INDEX IF NOT EXISTS "ServiceRequest_geom_idx"
ON "ServiceRequest" USING GIST (geom);

-- Index for date queries
CREATE INDEX IF NOT EXISTS "ServiceRequest_created_date_idx"
ON "ServiceRequest" (created_date);

-- ============================================================================

-- Vacant Properties
CREATE TABLE IF NOT EXISTS "VacantProperty" (
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
);

-- Spatial index for VacantProperty
CREATE INDEX IF NOT EXISTS "VacantProperty_geom_idx"
ON "VacantProperty" USING GIST (geom);

-- ============================================================================

-- Zoning Districts (Polygons)
CREATE TABLE IF NOT EXISTS "Zoning" (
    id TEXT PRIMARY KEY,
    zone_code TEXT NOT NULL,
    zone_class TEXT,
    label TEXT,
    geom geometry(MultiPolygon, 4326),
    imported_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for Zoning
CREATE INDEX IF NOT EXISTS "Zoning_geom_idx"
ON "Zoning" USING GIST (geom);

-- ============================================================================

-- Flood Zones (Polygons)
CREATE TABLE IF NOT EXISTS "FloodZone" (
    id TEXT PRIMARY KEY,
    fld_zone TEXT NOT NULL,
    fld_ar_id TEXT,
    zone_subty TEXT,
    static_bfe DOUBLE PRECISION,
    geom geometry(MultiPolygon, 4326),
    imported_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for FloodZone
CREATE INDEX IF NOT EXISTS "FloodZone_geom_idx"
ON "FloodZone" USING GIST (geom);

-- ============================================================================

-- Property Parcels (Polygons)
CREATE TABLE IF NOT EXISTS "Parcel" (
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
);

-- Spatial index for Parcel
CREATE INDEX IF NOT EXISTS "Parcel_geom_idx"
ON "Parcel" USING GIST (geom);

-- ============================================================================
-- Step 5: Backfill Existing Deal Records with Geometry
-- ============================================================================
-- Update existing deals that have lat/lon but no geometry

UPDATE "Deal"
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND geom IS NULL;

-- ============================================================================
-- Step 6: Verification Queries
-- ============================================================================

-- Check PostGIS is enabled
SELECT
    'PostGIS Enabled' as status,
    PostGIS_Version() as version;

-- Check spatial tables exist
SELECT
    'Spatial Tables' as status,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_name IN ('ServiceRequest', 'VacantProperty', 'Zoning', 'FloodZone', 'Parcel');

-- Check Deal table has spatial column
SELECT
    'Deal Spatial Column' as status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'Deal' AND column_name = 'geom'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as geom_column;

-- Check spatial indexes exist
SELECT
    'Spatial Indexes' as status,
    COUNT(*) as index_count
FROM pg_indexes
WHERE indexname LIKE '%geom_idx';

-- Count existing spatial data (will be 0 until import runs)
SELECT
    'ServiceRequest' as table_name,
    COUNT(*) as record_count,
    COUNT(geom) as spatial_count
FROM "ServiceRequest"
UNION ALL
SELECT
    'VacantProperty',
    COUNT(*),
    COUNT(geom)
FROM "VacantProperty"
UNION ALL
SELECT
    'Deal',
    COUNT(*),
    COUNT(geom)
FROM "Deal";

-- ============================================================================
-- NEXT STEPS AFTER RUNNING THIS SCRIPT
-- ============================================================================
-- 1. Verify all verification queries return expected results
-- 2. Set up environment variables in Railway:
--    - DATABASE_URL (from Supabase connection pooler)
--    - DIRECT_URL (from Supabase direct connection)
--    - BALTIMORE_OPEN_DATA_APP_TOKEN (optional, for rate limit increases)
-- 3. Deploy application to Railway (should auto-deploy from git push)
-- 4. SSH into Railway container and run data import:
--    railway run node scripts/importSpatialData.js
-- 5. Test spatial endpoints:
--    GET /api/deals/:id/spatial-risk
--    GET /api/deals/:id/spatial-context?radius=500
-- ============================================================================

-- TROUBLESHOOTING
-- ============================================================================
-- If you get "extension postgis does not exist":
--   Contact Supabase support - PostGIS should be available by default
--
-- If triggers don't fire:
--   Check trigger exists: SELECT * FROM pg_trigger WHERE tgname = 'deal_geom_trigger';
--   Check function exists: \df update_deal_geom
--
-- If spatial queries are slow:
--   Verify indexes: SELECT * FROM pg_indexes WHERE indexname LIKE '%geom%';
--   Run VACUUM ANALYZE on spatial tables
-- ============================================================================
