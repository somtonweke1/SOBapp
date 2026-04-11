# StoneBridge GIS Production Deployment Checklist

**Deployment Date:** _______________
**Deployed By:** _______________
**Railway URL:** https://stonebridge-web-production.up.railway.app

---

## Pre-Deployment Verification

- [x] Code committed to git (commit: 029c2e0)
- [x] Code pushed to GitHub main branch
- [ ] Railway project exists and is connected to GitHub repo
- [ ] Supabase project is provisioned and accessible

---

## Phase 1: Database Setup (Supabase)

### 1.1 Enable PostGIS Extension

- [ ] Log into Supabase Dashboard → SQL Editor
- [ ] Copy contents of `PRODUCTION_POSTGIS_SETUP.sql`
- [ ] Execute the full SQL script
- [ ] Verify PostGIS version appears (should be 3.x)
- [ ] Confirm no errors in execution log

**Verification Query:**
```sql
SELECT PostGIS_Version();
```
Expected: `3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`

### 1.2 Verify Spatial Tables Created

- [ ] Check all 5 spatial tables exist: `ServiceRequest`, `VacantProperty`, `Zoning`, `FloodZone`, `Parcel`
- [ ] Verify `Deal` table has `geom` column
- [ ] Confirm spatial indexes exist (should have 6 indexes ending in `_geom_idx`)

**Verification Query:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('ServiceRequest', 'VacantProperty', 'Zoning', 'FloodZone', 'Parcel', 'Deal');
```

### 1.3 Test Trigger Function

- [ ] Create a test deal with coordinates in Supabase
- [ ] Verify `geom` column is auto-populated

**Test Query:**
```sql
INSERT INTO "Deal" (id, address, city, state, latitude, longitude, "clientId", "signalSources")
VALUES (
    'test_spatial_001',
    '100 N Holliday St',
    'Baltimore',
    'MD',
    39.2904,
    -76.6103,
    (SELECT id FROM "User" LIMIT 1),
    ARRAY['TEST']
);

-- Check geometry was created
SELECT id, address, latitude, longitude, ST_AsText(geom) as geometry
FROM "Deal" WHERE id = 'test_spatial_001';

-- Cleanup test record
DELETE FROM "Deal" WHERE id = 'test_spatial_001';
```

---

## Phase 2: Railway Environment Configuration

### 2.1 Database Connection Strings

- [ ] Copy **Connection Pooler** URL from Supabase → Project Settings → Database
- [ ] Set Railway environment variable: `DATABASE_URL` = `<Connection Pooler URL>`
- [ ] Copy **Direct Connection** URL from Supabase
- [ ] Set Railway environment variable: `DIRECT_URL` = `<Direct Connection URL>`

**Format Check:**
- Connection Pooler should contain `@aws-0-us-east-1.pooler.supabase.com:6543`
- Direct URL should contain `@aws-0-us-east-1.compute.supabase.com:5432`

### 2.2 Application Secrets

Set these in Railway → Variables:

- [ ] `JWT_SECRET` = `<generate random 32-char string>`
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` or `sk_test_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] `OPERATOR_ACCESS_CODE` = `SB-334` (or custom code)
- [ ] `PORT` = `3000`

### 2.3 Optional API Keys

- [ ] `BALTIMORE_OPEN_DATA_APP_TOKEN` = `<from data.baltimorecity.gov>` (optional, increases rate limits)
- [ ] `SAM_GOV_API_KEY` = `<from sam.gov>` (for procurement signals)
- [ ] `PUBLIC_BASE_URL` = `https://stonebridge-web-production.up.railway.app`

---

## Phase 3: Application Deployment

### 3.1 Trigger Railway Build

- [ ] Railway should auto-deploy from latest git push
- [ ] Monitor build logs in Railway dashboard
- [ ] Verify build completes successfully (look for "Build successful")
- [ ] Check deploy logs show "Server running on port 3000"

**Common Build Issues:**
- If Prisma fails: Check `DATABASE_URL` is set correctly
- If port binding fails: Verify `PORT=3000` is set
- If PostGIS queries fail: Ensure SQL script ran successfully

### 3.2 Verify Application Health

- [ ] Visit https://stonebridge-web-production.up.railway.app
- [ ] Confirm landing page loads with stats
- [ ] Check navigation links work (Home, Diagnostics, Track Record, Capital, Operator)
- [ ] Verify no console errors in browser DevTools

---

## Phase 4: Data Import

### 4.1 Import Baltimore Spatial Data

**Option A: Via Railway CLI (Recommended)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run import script in production
railway run node scripts/importSpatialData.js
```

**Option B: Via SSH to Container**

```bash
# Get shell access to Railway container
railway shell

# Run import script
node scripts/importSpatialData.js

# Exit shell
exit
```

**Import Checklist:**
- [ ] Script starts and shows "Starting Baltimore spatial data import..."
- [ ] ServiceRequest import completes (~5,000 records)
- [ ] VacantProperty import completes (~2,000 records)
- [ ] No database connection errors
- [ ] Script completes with "Import complete" message

**Verification Query (run in Supabase):**
```sql
SELECT
    'ServiceRequest' as table_name,
    COUNT(*) as records,
    COUNT(geom) as with_geometry,
    MIN(created_date) as oldest,
    MAX(created_date) as newest
FROM "ServiceRequest"
UNION ALL
SELECT
    'VacantProperty',
    COUNT(*),
    COUNT(geom),
    MIN(notice_date),
    MAX(notice_date)
FROM "VacantProperty";
```

Expected:
- ServiceRequest: 4,000-6,000 records, >95% with geometry
- VacantProperty: 1,500-2,500 records, >95% with geometry

---

## Phase 5: Functional Testing

### 5.1 Test Geocoding

- [ ] Go to `/submit`
- [ ] Enter address: `100 N Holliday St, Baltimore, MD`
- [ ] Submit for free preview
- [ ] Verify diagnostic runs without errors
- [ ] Check response includes `coordinates` field in JSON

**API Test (curl):**
```bash
curl -X POST https://stonebridge-web-production.up.railway.app/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"address": "100 N Holliday St", "city": "Baltimore", "state": "MD"}'
```

Expected response should include:
```json
{
  "coordinates": {
    "latitude": 39.2904,
    "longitude": -76.6103
  }
}
```

### 5.2 Test Spatial Risk Analysis

**Prerequisites:**
- [ ] Complete a deal diagnosis to get a deal ID
- [ ] Note the deal ID from the response

**Test Endpoint:**
```bash
# Replace {dealId} with actual ID
curl https://stonebridge-web-production.up.railway.app/api/deals/{dealId}/spatial-risk
```

**Expected Response:**
```json
{
  "coordinates": { "latitude": 39.29, "longitude": -76.61 },
  "complaintDensity": {
    "count": 45,
    "density": 573.2,
    "radius": 500
  },
  "vacancyExposure": {
    "count": 12,
    "nearestDistance": 87.3
  },
  "floodZone": { "inFloodZone": false },
  "zoning": { "zoneCode": "R-8" },
  "riskScore": 42,
  "verdict": "CAUTION"
}
```

### 5.3 Test GeoJSON Export

**Test Endpoint:**
```bash
curl https://stonebridge-web-production.up.railway.app/api/deals/{dealId}/spatial-context?radius=500 \
  -H "Accept: application/geo+json"
```

**Expected:**
- [ ] Response Content-Type is `application/geo+json`
- [ ] GeoJSON FeatureCollection with type `FeatureCollection`
- [ ] Contains property feature + nearby complaints + vacancies
- [ ] All features have valid `geometry` objects

**Validate GeoJSON:**
- [ ] Copy response to https://geojson.io
- [ ] Verify features display on map correctly
- [ ] Confirm property point is in Baltimore

### 5.4 Test QGIS Import (Optional)

- [ ] Open QGIS
- [ ] Layer → Add Layer → Add Vector Layer
- [ ] Source: Protocol → HTTP(S), Type: GeoJSON
- [ ] URL: `https://stonebridge-web-production.up.railway.app/api/deals/{dealId}/spatial-context?radius=500`
- [ ] Verify layer loads with features

---

## Phase 6: Academic Use Case Testing

### 6.1 Run Case Studies Script

**Execute remotely:**
```bash
railway run node scripts/runCaseStudies.js
```

**Expected Outputs:**
- [ ] 3 case studies complete successfully
- [ ] Files created in `outputs/` directory
- [ ] All GeoJSON files are valid

**Verify locally:**
```bash
ls -lh stonebridge/outputs/
```

Should show:
- `case_study_results.json`
- `case_study_1_spatial_context.geojson`
- `case_study_2_spatial_context.geojson`
- `case_study_3_spatial_context.geojson`
- `case_study_report.md`

### 6.2 Generate Academic Maps

- [ ] Open QGIS
- [ ] Import all 3 case study GeoJSON files
- [ ] Add OpenStreetMap basemap
- [ ] Style features appropriately
- [ ] Export maps as PNG (300 dpi)

---

## Phase 7: Production Monitoring

### 7.1 Set Up Error Monitoring

- [ ] Check Railway logs for any startup errors
- [ ] Monitor for PostGIS-related errors
- [ ] Watch for geocoding API rate limit warnings

**Common Warnings (Safe to Ignore):**
- `Nominatim rate limit: waiting 1s` - Normal geocoding throttling
- `OpenStreetMap Nominatim usage policy` - Standard API notice

**Critical Errors (Must Fix):**
- `PostGIS extension not found` - Rerun SQL setup script
- `relation "ServiceRequest" does not exist` - Run migrations
- `Cannot connect to database` - Check Railway env vars

### 7.2 Performance Checks

- [ ] Test page load time < 3 seconds
- [ ] Diagnostic API response < 5 seconds (with geocoding)
- [ ] Spatial queries return < 2 seconds
- [ ] No memory leaks in Railway metrics

### 7.3 Data Freshness

Set up a monthly cron job to refresh spatial data:

```bash
# Add to Railway cron or external scheduler
0 0 1 * * railway run node scripts/importSpatialData.js
```

- [ ] Document data refresh schedule
- [ ] Set calendar reminder to check data quality

---

## Phase 8: Documentation & Handoff

### 8.1 Update README

- [ ] Add production URL to README
- [ ] Document environment variables required
- [ ] Include data import instructions
- [ ] Add troubleshooting section

### 8.2 Academic Project Deliverables

Verify these files exist and are up-to-date:

- [ ] `GIS_FEATURES.md` - Technical documentation
- [ ] `GIS_SETUP_GUIDE.md` - Setup instructions
- [ ] `GIS_IMPLEMENTATION_SUMMARY.md` - Academic project guide
- [ ] `PRODUCTION_POSTGIS_SETUP.sql` - Database setup script
- [ ] `DEPLOYMENT_CHECKLIST.md` - This file

### 8.3 Access Credentials Documented

Document and securely store:

- [ ] Railway login credentials
- [ ] Supabase project credentials
- [ ] Stripe dashboard access
- [ ] GitHub repository access
- [ ] Domain registrar (if applicable)

---

## Rollback Plan

If deployment fails, follow these steps:

### Immediate Rollback

1. [ ] Revert to previous commit: `git revert 029c2e0`
2. [ ] Push revert: `git push origin main`
3. [ ] Railway will auto-deploy previous version
4. [ ] Verify application returns to working state

### Preserve Data

- [ ] Spatial data in Supabase is preserved (tables won't be dropped)
- [ ] Deal records with coordinates remain intact
- [ ] No data loss from rollback

### Retry Deployment

- [ ] Review Railway build logs for errors
- [ ] Check Supabase query logs
- [ ] Verify all environment variables are set
- [ ] Re-run this checklist from Phase 1

---

## Success Criteria

Deployment is successful when ALL of these are true:

- [x] Code deployed to Railway
- [ ] Landing page loads at production URL
- [ ] PostGIS enabled in Supabase
- [ ] Spatial tables populated with Baltimore data
- [ ] Geocoding works for test addresses
- [ ] Spatial risk analysis returns valid scores
- [ ] GeoJSON export validates in QGIS
- [ ] No critical errors in Railway logs
- [ ] Case studies generate valid outputs

**Deployment Status:** ⏳ In Progress

---

## Post-Deployment Notes

**Completed By:** _______________
**Completion Date:** _______________
**Issues Encountered:**

_____________________________________________________________________________

_____________________________________________________________________________

**Resolution Steps:**

_____________________________________________________________________________

_____________________________________________________________________________

**Production URL Verified:** [ ] Yes [ ] No

**Data Import Completed:** [ ] Yes [ ] No

**Academic Features Tested:** [ ] Yes [ ] No

---

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch Railway logs and error rates
2. **Run test diagnostics** - Process 5-10 real Baltimore addresses
3. **Generate academic deliverables** - Run case studies and create maps
4. **Share with stakeholders** - Send production URL + documentation
5. **Schedule data refresh** - Set up monthly import job
6. **Plan next features** - Review GIS_FEATURES.md "Future Extensions"

---

## Support Resources

- **Railway Docs:** https://docs.railway.app
- **Supabase PostGIS:** https://supabase.com/docs/guides/database/extensions/postgis
- **QGIS Manual:** https://docs.qgis.org
- **Baltimore Open Data:** https://data.baltimorecity.gov
- **GeoJSON Spec:** https://geojson.org

---

**Deployment Lead:** _______________
**Sign-off Date:** _______________
**Next Review:** _______________
