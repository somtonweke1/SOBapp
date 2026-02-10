# Check Vercel Environment Variables

## Go Here:
https://vercel.com/somtonweke1s-projects/networksystems/settings/environment-variables

## Look for:
- DATABASE_URL (should be set to Production ✅)
- POSTGRES_PRISMA_URL (might also be needed)

## If DATABASE_URL is missing or wrong:

### Option 1: Use POSTGRES_PRISMA_URL instead
Add a new environment variable:
- Key: DATABASE_URL
- Value: Copy from POSTGRES_PRISMA_URL
- Environment: ✅ Production

### Option 2: Get from Neon directly
1. Click on "Inversion-analytics-neon" in Storage
2. Copy the POSTGRES_PRISMA_URL value
3. Add as DATABASE_URL in Environment Variables

## After fixing:
Redeploy from Deployments tab
