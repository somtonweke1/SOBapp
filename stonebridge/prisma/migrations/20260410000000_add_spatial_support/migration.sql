-- Enable PostGIS extension for spatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add latitude and longitude columns to Deal table
ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add geometry column for PostGIS spatial queries
-- Using SRID 4326 (WGS 84 - standard lat/lon coordinate system)
SELECT AddGeometryColumn('public', 'Deal', 'geom', 4326, 'POINT', 2);

-- Create spatial index for efficient queries
CREATE INDEX IF NOT EXISTS "Deal_geom_idx" ON "Deal" USING GIST (geom);

-- Create function to auto-update geometry from lat/lon
CREATE OR REPLACE FUNCTION update_deal_geometry()
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

-- Create trigger to automatically update geometry when lat/lon changes
DROP TRIGGER IF EXISTS deal_geometry_trigger ON "Deal";
CREATE TRIGGER deal_geometry_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude ON "Deal"
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_geometry();
