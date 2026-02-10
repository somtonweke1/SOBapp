# Vercel Production Setup for MIAR + PFAS Module

## 🎯 Quick Setup (5 Minutes)

Your code is already pushed to GitHub and Vercel is connected. You just need to set up the production database.

---

## Step 1: Create PostgreSQL Database

### Option A: Vercel Postgres (Recommended - Easiest)

1. Go to: https://vercel.com/somtonweke1s-projects/networksystems
2. Click **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a region (same as your deployment)
6. Click **Create**
7. Vercel will automatically add `DATABASE_URL` to your environment variables ✅

### Option B: Supabase (Free Tier Available)

1. Go to: https://supabase.com
2. Create new project
3. Copy the connection string (Direct Connection, not Pooler)
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`
5. Add to Vercel (see Step 2)

### Option C: Railway (Free Tier Available)

1. Go to: https://railway.app
2. New Project → Provision PostgreSQL
3. Copy the DATABASE_URL
4. Add to Vercel (see Step 2)

---

## Step 2: Add DATABASE_URL to Vercel

1. Go to: https://vercel.com/somtonweke1s-projects/networksystems
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `DATABASE_URL`
   - **Value:** Your PostgreSQL connection string
   - **Environments:** ✅ Production, ✅ Preview (optional)
4. Click **Save**

---

## Step 3: Trigger Redeployment

### Option 1: Automatic (Recommended)
```bash
# I'll push a trigger commit
cd /Users/somtonweke/MIAR
git commit --allow-empty -m "trigger: Redeploy with PostgreSQL"
git push origin master
```

### Option 2: Manual
1. Go to Vercel dashboard
2. Click **Deployments** tab
3. Click **⋯** on latest deployment
4. Click **Redeploy**

---

## Step 4: Verify Deployment

After ~2 minutes, check:

### Test Health Endpoint
```bash
curl https://miar.live/api/health
# Should return: "status": "healthy"
```

### Test PFAS Endpoint
```bash
node test-pfas-api.js
# Should return: ✅ SUCCESS! PFAS Module is LIVE!
```

---

## 🔧 What I Already Set Up

### ✅ Automatic Migrations
- Build script now runs migrations automatically
- Only runs when PostgreSQL DATABASE_URL is present
- Skips migrations in development (SQLite)

### ✅ Schema Updated
- Changed from SQLite → PostgreSQL
- Added PFASScanResult and PFASValidationData tables
- Backup SQLite schema saved in `prisma/schema-sqlite.prisma`

### ✅ Smart Migration Script
Location: `scripts/migrate-production.js`

Features:
- Detects database type automatically
- Skips migrations if DATABASE_URL not set
- Provides helpful error messages
- Safe for both development and production

---

## 📊 Environment Variables Needed

### Required (Must Set in Vercel)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXTAUTH_SECRET=your-random-secret-key
```

### Recommended
```bash
NEXTAUTH_URL=https://miar.live
SENTRY_DSN=your-sentry-dsn  # For error tracking
```

### Optional (For Full Features)
```bash
ALPHA_VANTAGE_API_KEY=
NEWS_API_KEY=
UPSTASH_REDIS_REST_URL=  # For caching/rate limiting
```

---

## 🚨 Troubleshooting

### Build Fails with "Cannot find module 'prisma'"
**Solution:** Prisma is in devDependencies, which is correct. Vercel installs them automatically.

### "PrismaClientInitializationError"
**Solution:** DATABASE_URL not set in Vercel environment variables. Add it in Settings → Environment Variables.

### Migrations Fail
**Solutions:**
1. Check DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`
2. Ensure database is accessible from Vercel (check firewall/IP whitelist)
3. Verify database credentials are correct

### "Table does not exist" Error
**Solution:** Migrations didn't run. Check build logs in Vercel for migration errors.

---

## 📝 Database Schema

### Tables Created (Automatic)
```sql
-- BIS Scanner (existing)
ScanResult

-- PFAS Module (new)
PFASScanResult
PFASValidationData

-- Plus all existing MIAR tables
User, Network, Analysis, Scenario, etc.
```

---

## 🎉 Success Indicators

When setup is complete, you should see:

### Vercel Build Logs
```
🔍 Checking database configuration...
🗄️  Production database detected
📦 Running Prisma migrations...
✅ Migrations completed successfully
✔ Generating Prisma Client...
```

### API Response
```bash
curl https://miar.live/api/pfas-scan -X POST -H "Content-Type: application/json" -d '{...}'

# Returns:
{
  "success": true,
  "scanId": "pfas_abc123...",
  "summary": {
    "totalPFASDetected": 10,
    "overallRiskScore": 7.2,
    "urgencyLevel": "high"
  }
}
```

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/somtonweke1s-projects/networksystems
- **Vercel Postgres Docs:** https://vercel.com/docs/storage/vercel-postgres
- **Prisma Deploy Docs:** https://www.prisma.io/docs/guides/deployment
- **PFAS API Docs:** See `PFAS_INTEGRATION_COMPLETE.md`

---

## 💬 Questions?

If you run into issues:

1. Check Vercel build logs (Deployments → Click deployment → View Build Logs)
2. Check Function logs (Deployments → Click deployment → View Function Logs)
3. Verify DATABASE_URL is set correctly
4. Make sure database is PostgreSQL (not SQLite)

---

**Once DATABASE_URL is set in Vercel, the next deployment will automatically run migrations and the PFAS module will be fully operational! 🚀**
