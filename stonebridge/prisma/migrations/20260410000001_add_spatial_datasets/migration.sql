-- Create table for Baltimore 311 Service Requests (spatial points)
CREATE TABLE IF NOT EXISTS "ServiceRequest" (
  id TEXT PRIMARY KEY,
  request_type TEXT,
  service_request_num TEXT,
  address TEXT,
  neighborhood TEXT,
  created_date TIMESTAMP,
  updated_date TIMESTAMP,
  status TEXT,
  geom geometry(Point, 4326)
);

CREATE INDEX IF NOT EXISTS "ServiceRequest_geom_idx" ON "ServiceRequest" USING GIST (geom);
CREATE INDEX IF NOT EXISTS "ServiceRequest_type_idx" ON "ServiceRequest" (request_type);
CREATE INDEX IF NOT EXISTS "ServiceRequest_status_idx" ON "ServiceRequest" (status);

-- Create table for Vacant Properties (spatial points)
CREATE TABLE IF NOT EXISTS "VacantProperty" (
  id TEXT PRIMARY KEY,
  reference_id TEXT,
  address TEXT,
  neighborhood TEXT,
  notice_date TIMESTAMP,
  building_type TEXT,
  geom geometry(Point, 4326)
);

CREATE INDEX IF NOT EXISTS "VacantProperty_geom_idx" ON "VacantProperty" USING GIST (geom);

-- Create table for Zoning (spatial polygons)
CREATE TABLE IF NOT EXISTS "Zoning" (
  id SERIAL PRIMARY KEY,
  zoning_code TEXT,
  zoning_description TEXT,
  geom geometry(MultiPolygon, 4326)
);

CREATE INDEX IF NOT EXISTS "Zoning_geom_idx" ON "Zoning" USING GIST (geom);

-- Create table for Flood Zones (spatial polygons)
CREATE TABLE IF NOT EXISTS "FloodZone" (
  id SERIAL PRIMARY KEY,
  zone_type TEXT,
  flood_zone TEXT,
  zone_subtype TEXT,
  geom geometry(MultiPolygon, 4326)
);

CREATE INDEX IF NOT EXISTS "FloodZone_geom_idx" ON "FloodZone" USING GIST (geom);

-- Create table for Baltimore Parcels (spatial polygons)
CREATE TABLE IF NOT EXISTS "Parcel" (
  id TEXT PRIMARY KEY,
  block TEXT,
  lot TEXT,
  address TEXT,
  owner_name TEXT,
  land_use TEXT,
  geom geometry(MultiPolygon, 4326)
);

CREATE INDEX IF NOT EXISTS "Parcel_geom_idx" ON "Parcel" USING GIST (geom);
CREATE INDEX IF NOT EXISTS "Parcel_address_idx" ON "Parcel" (address);
