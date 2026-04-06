# StoneBridge Railway Deploy

This app can be deployed to Railway from the `stonebridge/` directory.

## Required environment variables

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `OPERATOR_ACCESS_CODE`
- `PORT` is provided by Railway

Optional:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BALTIMORE_OPEN_DATA_APP_TOKEN`
- `SAM_GOV_API_KEY`

## Deploy notes

- Railway will run `npm install` and `npm start`.
- `railway.json` runs `npm run deploy:prepare` before startup.
- `deploy:prepare` runs `prisma generate` and `prisma db push`.
- There are no checked-in Prisma migrations, so schema sync currently relies on `prisma db push`.
- Seed data is not run automatically. `npm run db:seed` now creates only the operator account by default. If you explicitly want sample users and sample deals, run `SEED_SAMPLE_DATA=true npm run db:seed`.

## Recommended Railway setup

1. Create a new Railway service from the `stonebridge/` folder.
2. Attach a PostgreSQL database.
3. Set both `DATABASE_URL` and `DIRECT_URL` from that database.
4. Add the remaining environment variables.
5. Deploy.
