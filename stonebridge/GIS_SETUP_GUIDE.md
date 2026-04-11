# StoneBridge GIS Setup Guide

Complete setup instructions for enabling GIS features in StoneBridge.

## Prerequisites

- Supabase PostgreSQL database (or any PostgreSQL 12+ with PostGIS support)
- Node.js 16+ installed
- Database connection strings in `.env`

## Step-by-Step Setup

### 1. Enable PostGIS Extension

Connect to your Supabase database and run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version(); -- Should return version info (e.g., "3.4.0")
```

**Supabase Dashboard Method:**
1. Go to Supabase Dashboard → SQL Editor
2. Paste the SQL above
3. Click "Run"

### 2. Run Database Migrations

Execute the spatial migrations to add geometry columns and spatial tables:

```bash
cd /Users/somtonweke/SOBApp/stonebridge

# Apply Prisma schema changes
npx prisma db push

# Run spatial migrations manually (if needed)
# Execute SQL from these files in Supabase SQL Editor:
# 1. prisma/migrations/20260410000000_add_spatial_support/migration.sql
# 2. prisma/migrations/20260410000001_add_spatial_datasets/migration.sql
```

**Manual Migration (Supabase):**

Copy and paste these files into Supabase SQL Editor:

1. `prisma/migrations/20260410000000_add_spatial_support/migration.sql`
   - Enables PostGIS
   - Adds latitude/longitude/geom to Deal table
   - Creates automatic geometry trigger

2. `prisma/migrations/20260410000001_add_spatial_datasets/migration.sql`
   - Creates ServiceRequest table
   - Creates VacantProperty table
   - Creates Zoning, FloodZone, Parcel tables
   - Creates spatial indexes

### 3. Verify Schema Changes

Check that the Deal table has spatial columns:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Deal'
AND column_name IN ('latitude', 'longitude', 'geom');
```

Expected output:
```
latitude  | double precision
longitude | double precision
geom      | USER-DEFINED (geometry)
```

### 4. Import Baltimore Spatial Data

```bash
cd /Users/somtonweke/SOBApp/stonebridge
node scripts/importSpatialData.js
```

**Expected output:**
```
============================================================
Baltimore Spatial Data Import
============================================================
[Import] PostGIS version: 3.4.0
[Import] Starting 311 Service Requests import...
[Import] Fetching from: https://data.baltimorecity.gov/resource/...
[Import] Fetched 5000 records
[Import] 311 Service Requests: 4832 imported, 168 skipped

[Import] Starting Vacant Properties import...
[Import] Fetched 2000 records
[Import] Vacant Properties: 1894 imported, 106 skipped

============================================================
Import Summary
============================================================
Service Requests: 4832
Vacant Properties: 1894
Total: 6726

Database totals: { service_requests: '4832', vacant_properties: '1894' }

[Import] Complete
```

**Troubleshooting:**
- If import fails with geocoding errors, data will still be loaded (coordinates may be estimated)
- Re-run the script to update data (uses ON CONFLICT for upserts)

### 5. Verify Spatial Data

Check that spatial data was loaded correctly:

```sql
-- Count service requests with valid geometry
SELECT COUNT(*) FROM "ServiceRequest" WHERE geom IS NOT NULL;

-- Count vacant properties with valid geometry
SELECT COUNT(*) FROM "VacantProperty" WHERE geom IS NOT NULL;

-- Test spatial query: find complaints within 500m of a point
SELECT COUNT(*)
FROM "ServiceRequest"
WHERE ST_DWithin(
  geom,
  ST_SetSRID(ST_MakePoint(-76.6122, 39.2904), 4326)::geography,
  500
);
```

### 6. Test Geocoding Service

Create a test script or use Node.js REPL:

```bash
node
```

```javascript
const { geocodeAddress } = require('./src/services/geocode');

geocodeAddress('100 N Holliday St', 'Baltimore', 'MD')
  .then(result => {
    console.log('Geocoding result:', result);
    // Expected: { latitude: 39.29..., longitude: -76.61..., ... }
  });
```

### 7. Test Spatial Risk Analysis

```javascript
const { computeSpatialRisk } = require('./src/services/spatialRisk');

computeSpatialRisk(39.2904, -76.6122)
  .then(risk => {
    console.log('Spatial risk:', risk);
    // Expected: { spatialRiskScore: 42, spatialVerdict: 'CAUTION', ... }
  });
```

### 8. Run Development Server

```bash
npm run dev
```

Server should start on http://localhost:3000

### 9. Test GIS API Endpoints

First, create a test deal:

```bash
curl -X POST http://localhost:3000/api/deals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "address": "100 N Holliday St",
    "city": "Baltimore",
    "state": "MD"
  }'
```

Then test spatial endpoints:

```bash
# Get spatial risk
curl http://localhost:3000/api/deals/<deal-id>/spatial-risk \
  -H "Authorization: Bearer <your-jwt-token>"

# Get GeoJSON spatial context
curl http://localhost:3000/api/deals/<deal-id>/spatial-context?radius=500 \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 10. Run Case Studies (for Academic Projects)

```bash
node scripts/runCaseStudies.js
```

**Output files:**
- `outputs/case_study_results.json` - Full analysis data
- `outputs/case_study_*.geojson` - GeoJSON files for QGIS
- `outputs/case_study_report.md` - Markdown report template

### 11. Generate Maps in QGIS

1. Install QGIS: https://qgis.org/en/site/forusers/download.html

2. Open QGIS and add GeoJSON layer:
   - Layer → Add Layer → Add Vector Layer
   - Source: `outputs/case_study_1_spatial_context.geojson`
   - Click "Add"

3. Add OpenStreetMap basemap:
   - Browser Panel → XYZ Tiles → Right-click → "New Connection"
   - Name: OpenStreetMap
   - URL: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
   - Click "OK"
   - Drag "OpenStreetMap" to Layers panel

4. Style points:
   - Right-click layer → Properties → Symbology
   - Choose "Categorized" and select `type` field
   - Assign colors: property (red), complaint (orange), vacancy (yellow)

5. Export map:
   - Project → Import/Export → Export Map to Image
   - Resolution: 300 dpi
   - Save to `outputs/map_case_study_1.png`

## Verification Checklist

- [ ] PostGIS extension enabled
- [ ] Deal table has latitude, longitude, geom columns
- [ ] Spatial tables created (ServiceRequest, VacantProperty, etc.)
- [ ] Spatial indexes created (check with `\d+ "ServiceRequest"` in psql)
- [ ] Spatial data imported (5000+ service requests, 2000+ vacant properties)
- [ ] Geocoding service works (test with sample address)
- [ ] Spatial risk analysis works (test with coordinates)
- [ ] API endpoints return valid responses
- [ ] GeoJSON exports load in QGIS
- [ ] Case study script generates outputs

## Common Issues

### Issue: PostGIS functions not found

**Error:** `ERROR: function ST_MakePoint does not exist`

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: Geocoding returns null

**Cause:** Rate limiting or invalid address

**Solutions:**
- Wait 1 second between geocoding requests
- Verify address format: "100 N Holliday St, Baltimore, MD"
- Check OpenStreetMap Nominatim service status

### Issue: Spatial queries return 0 results

**Cause:** No spatial data imported

**Solution:**
```bash
node scripts/importSpatialData.js
```

### Issue: Prisma schema sync errors

**Error:** `Prisma schema field doesn't exist in database`

**Solution:**
```bash
npx prisma db push --accept-data-loss
# OR manually add columns:
ALTER TABLE "Deal" ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE "Deal" ADD COLUMN longitude DOUBLE PRECISION;
```

### Issue: CORS errors in browser

**Cause:** API called from unauthorized origin

**Solution:** Update CORS config in `src/app.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

## Development Tips

1. **Use Supabase Studio** for SQL queries and table inspection
2. **Check logs** with `console.log` in geocoding/spatial services
3. **Test spatial queries** directly in SQL before implementing in code
4. **Use QGIS** to visualize spatial data during development
5. **Rate limit geocoding** to avoid IP bans from Nominatim

## Production Deployment

### Environment Variables

Ensure these are set:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # For Supabase
```

### Railway/Vercel Deployment

1. PostGIS must be enabled in production database
2. Run migrations on production database:
   ```bash
   npx prisma migrate deploy
   ```
3. Import spatial data on production:
   ```bash
   node scripts/importSpatialData.js
   ```

### Performance Optimization

1. **Spatial indexes:** Ensure GIST indexes exist on all geom columns
2. **Connection pooling:** Use PgBouncer for high-traffic scenarios
3. **Caching:** Cache geocoding results to reduce API calls
4. **Batch operations:** Import data in batches to avoid timeouts

## Next Steps

1. Review `GIS_FEATURES.md` for detailed API documentation
2. Run case studies for your semester project
3. Generate maps in QGIS using exported GeoJSON
4. Write methodology section using spatial analysis methods
5. Present spatial risk scores in final report

---

**Setup complete!** You now have a fully functional GIS-enabled real estate risk analysis system.

For questions or issues, refer to:
- `GIS_FEATURES.md` - Full feature documentation
- `scripts/runCaseStudies.js` - Case study implementation
- `src/services/spatialRisk.js` - Spatial analysis code
