# StoneBridge Quick Command Reference

**Production URL:** https://stonebridge-web-production.up.railway.app

---

## ✅ Current Status

**Railway Project:** stonebridge-ai
**Environment:** production
**Service:** stonebridge-web

**Environment Variables Set:**
- ✅ DATABASE_URL
- ✅ DIRECT_URL
- ✅ JWT_SECRET

**Your Generated JWT_SECRET:**
```
JWT_SECRET=4cfef4fea578fd536a9e5645ba061243fe9f70af15d184efe13698254c05da44
```
*(Already set in Railway, saved here for reference)*

---

## Railway CLI Commands

### Check Status
```bash
railway status                    # Show current project/environment
railway whoami                    # Show logged-in user
railway logs                      # View live deployment logs
railway logs --tail               # Follow logs in real-time
```

### Environment Variables
```bash
railway variables                 # List all variables
railway variables --kv            # List in KEY=VALUE format
railway variables set KEY=value   # Set a variable
```

### Missing Variables to Set (Optional)
```bash
# Stripe (for payments)
railway variables set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
railway variables set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Baltimore Open Data (for higher rate limits)
railway variables set BALTIMORE_OPEN_DATA_APP_TOKEN=YOUR_TOKEN

# Public URL (for SEO)
railway variables set PUBLIC_BASE_URL=https://stonebridge-web-production.up.railway.app

# Operator access code (already defaults to SB-334)
railway variables set OPERATOR_ACCESS_CODE=SB-334
```

### Run Commands on Railway
```bash
railway run <command>             # Execute command in production environment
railway shell                     # SSH into production container
```

---

## Data Import Commands

### Option 1: Run Import from Local Machine
```bash
# Import Baltimore spatial data (5,000+ records)
railway run node scripts/importSpatialData.js

# Run academic case studies
railway run node scripts/runCaseStudies.js
```

### Option 2: Run from Railway Shell
```bash
# SSH into production
railway shell

# Run import inside container
node scripts/importSpatialData.js

# Exit when done
exit
```

---

## Testing Commands

### Test Geocoding (Local)
```bash
node -e "require('./src/services/geocode').geocodeAddress('100 N Holliday St', 'Baltimore', 'MD').then(console.log)"
```

### Test API Endpoints (Production)
```bash
# Test landing page
curl https://stonebridge-web-production.up.railway.app

# Test diagnostic API
curl -X POST https://stonebridge-web-production.up.railway.app/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"address": "100 N Holliday St", "city": "Baltimore", "state": "MD"}'

# Test spatial risk (replace DEAL_ID)
curl https://stonebridge-web-production.up.railway.app/api/deals/DEAL_ID/spatial-risk

# Test GeoJSON export (replace DEAL_ID)
curl https://stonebridge-web-production.up.railway.app/api/deals/DEAL_ID/spatial-context?radius=500
```

---

## Database Commands (Supabase)

### Connect via psql
```bash
# Get connection string from Supabase dashboard
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Verify PostGIS
```sql
SELECT PostGIS_Version();
```

### Check Spatial Data
```sql
-- Count imported records
SELECT
    'ServiceRequest' as table, COUNT(*) as count
FROM "ServiceRequest"
UNION ALL
SELECT 'VacantProperty', COUNT(*) FROM "VacantProperty"
UNION ALL
SELECT 'Deal with coords', COUNT(*) FROM "Deal" WHERE geom IS NOT NULL;
```

### Manual Import (if needed)
```sql
-- Copy and run PRODUCTION_POSTGIS_SETUP.sql in Supabase SQL Editor
-- File location: stonebridge/PRODUCTION_POSTGIS_SETUP.sql
```

---

## Git Deployment Commands

### Check Recent Commits
```bash
git log --oneline -5              # Last 5 commits
git show HEAD                     # Show latest commit details
```

### Deploy New Changes
```bash
git add .
git commit -m "your message"
git push origin main              # Railway auto-deploys from main
```

### Rollback if Needed
```bash
git revert HEAD                   # Revert last commit
git push origin main              # Deploy rollback
```

---

## Local Development Commands

### Start Local Server
```bash
npm run dev                       # Start with auto-reload
npm start                         # Start production mode
```

### Database Management
```bash
npx prisma generate               # Generate Prisma Client
npx prisma db push                # Push schema changes to DB
npx prisma studio                 # Open database GUI
```

### Run Scripts Locally
```bash
node scripts/importSpatialData.js     # Import spatial data
node scripts/runCaseStudies.js        # Generate case studies
node scripts/smoke.js                 # Run smoke tests
```

---

## QGIS Integration

### Import GeoJSON from Production
1. Open QGIS
2. Layer → Add Layer → Add Vector Layer
3. Source Type: **Protocol: HTTP(S), Type: GeoJSON**
4. URL: `https://stonebridge-web-production.up.railway.app/api/deals/DEAL_ID/spatial-context?radius=500`
5. Add layer and style features

### Import Local GeoJSON Files
```bash
# Generate case studies first
railway run node scripts/runCaseStudies.js

# Files will be in outputs/
ls -la outputs/case_study_*.geojson

# Import to QGIS
# Layer → Add Layer → Add Vector Layer → File → Select .geojson file
```

---

## Production Monitoring

### Watch Live Logs
```bash
railway logs --tail               # Follow deployment logs
```

### Check Application Health
```bash
# Quick health check
curl -I https://stonebridge-web-production.up.railway.app

# Should return: HTTP/2 200
```

### Monitor Errors
```bash
# Filter for errors in logs
railway logs | grep -i error

# Filter for spatial/GIS errors
railway logs | grep -i "postgis\|spatial\|geocod"
```

---

## Next Immediate Actions

### 1. Run Spatial Data Import (Required for GIS features)
```bash
railway run node scripts/importSpatialData.js
```
**Time:** 5-10 minutes
**Result:** Imports ~5,000 ServiceRequests and ~2,000 VacantProperties

### 2. Test Diagnostic with Address
Visit: https://stonebridge-web-production.up.railway.app/submit
Enter: `100 N Holliday St, Baltimore, MD`

### 3. Generate Academic Case Studies
```bash
railway run node scripts/runCaseStudies.js
```
**Output:** 3 case study GeoJSON files + report markdown

---

## Troubleshooting

### App Won't Start
```bash
railway logs                      # Check for errors
railway variables                 # Verify DATABASE_URL is set
```

### Geocoding Fails
```bash
# Check Nominatim rate limiting
railway logs | grep -i nominatim

# Test locally first
node -e "require('./src/services/geocode').geocodeAddress('100 N Holliday St', 'Baltimore', 'MD').then(console.log)"
```

### PostGIS Errors
```bash
# Verify PostGIS is enabled in Supabase
# Run: stonebridge/PRODUCTION_POSTGIS_SETUP.sql in Supabase SQL Editor
```

### Data Import Fails
```bash
# Check database connection
railway run node -e "require('@prisma/client').PrismaClient().then(c => c.\$connect()).then(() => console.log('Connected')).catch(console.error)"

# Check if spatial tables exist
# Run in Supabase: SELECT table_name FROM information_schema.tables WHERE table_name = 'ServiceRequest';
```

---

## Documentation Files

All in `stonebridge/` directory:

- `DEPLOYMENT_CHECKLIST.md` - Full deployment guide
- `PRODUCTION_POSTGIS_SETUP.sql` - Database setup SQL
- `GIS_FEATURES.md` - Technical API docs
- `GIS_SETUP_GUIDE.md` - Setup instructions
- `GIS_IMPLEMENTATION_SUMMARY.md` - Academic project guide
- `QUICK_COMMANDS.md` - This file

---

## Support Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Repo:** https://github.com/somtonweke1/SOBapp
- **Production App:** https://stonebridge-web-production.up.railway.app
- **Baltimore Open Data:** https://data.baltimorecity.gov
- **QGIS Download:** https://qgis.org/download

---

**Last Updated:** 2026-04-11
**Railway User:** Somto Nweke (somtonwekec@gmail.com)
**Project:** stonebridge-ai (production)
