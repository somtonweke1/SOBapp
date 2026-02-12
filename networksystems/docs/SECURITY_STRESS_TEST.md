# SECURITY_STRESS_TEST.md

Senior Auditor pre-flight checklist for SOBapp Forensic Shield.

## Zone 1: Perimeter Defense (OPS_ACCESS_KEY)
- Verify `/api/pdf/generate` returns `401 Unauthorized` with no `key` param.
- Verify `/api/nodes/scan` returns `401 Unauthorized` with no `key` param.
- Verify `/ops/proposal` renders the access-gated screen without `key`.
- Verify `x-ops-key` header works and does not accept malformed values.
- Confirm `OPS_ACCESS_KEY` is set in local `.env` and production environment variables.

## Zone 2: Data Race Conditions (Socrata + ArcGIS)
- Simulate a 504/timeout from Socrata and ArcGIS (e.g., disable network or force invalid URL).
- Confirm the UI does not crash and shows a pragmatic error state.
- Confirm stale data is not served when `revalidate=600` data is older than audit thresholds.
- Confirm `/api/nodes/scan` returns a partial node list when one upstream source fails.

## Zone 3: PDF Render Engine (Puppeteer)
- Generate 5 consecutive PDFs in under 60 seconds.
- Confirm no memory spikes or crashes in logs.
- Validate PDF layout: A4, Harbor Bank seal aligned, service agreement visible.
- Confirm PDF output is identical between cold start and warm start.

## Zone 4: Relational Integrity (Prisma)
- Confirm `User` -> `WaterAudit` relation exists and saves properly.
- Confirm `onDelete: Cascade` for `WaterAudit` is safe and no orphaned rows remain.
- Run `npx prisma db push` and validate schema health.

## Zone 5: War Room Performance
- Load 500+ nodes and verify FPS remains stable.
- Confirm camera focus remains on Russell St / Biopark midpoint.
- Confirm red/amber nodes render correctly and evidence overlay is responsive.

## Ready for Deployment Checklist
- All zones passed.
- `npm run build` succeeds without warnings.
- `/api/nodes/scan?zipCode=21201&key=YOUR_KEY` returns live data.
- `/api/pdf/generate?key=YOUR_KEY` downloads a valid audit PDF.

## Break Glass: Security Recovery Protocol
1. **Immediate Rotation**
   - Rotate `OPS_ACCESS_KEY` in Vercel/production env vars.
   - Rotate local `.env` and any shared secrets in team notes.
2. **Session Invalidation**
   - Purge edge/serverless caches for `/api/pdf/generate` and `/api/nodes/scan`.
   - Redeploy to force cold starts and clear any in-memory tokens.
3. **Audit Trail**
   - Review Vercel logs for `401 Unauthorized` spikes on `/api/pdf/generate` and `/api/nodes/scan`.
   - Search for repeated invalid key attempts and note timestamps + IPs.
4. **Hardware Lock**
   - Refresh all hub displays and clear browser cache to enforce new key.
   - If shared kiosk mode is enabled, restart kiosk sessions after rotation.
