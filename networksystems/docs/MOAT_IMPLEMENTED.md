# StoneBridge Moat Implementation (Concrete)

## What is now implemented

### 1) Evidence Graph (hard-to-copy provenance layer)
- File: `src/lib/risk/evidence-graph.ts`
- Endpoint: `GET /api/public-risk/evidence-graph`
- Links each finding across:
  - agency -> contract -> vendor entity -> risk flag -> statute -> source URL
- Output includes graph summary and counts for strict/high risk findings.

### 2) Vendor Entity Resolution (identity layer)
- File: `src/lib/risk/vendor-resolution.ts`
- Endpoint: `GET /api/public-risk/vendor-entities`
- Normalizes vendor aliases (`LLC`, punctuation, DBA-like variants) into canonical entities.
- Tracks alias sets and concentration exposure by canonical vendor entity.

### 3) Challenge Engine (defensibility layer)
- File: `src/lib/risk/challenge-engine.ts`
- Endpoint: `GET /api/public-risk/challenge`
- Applies adversarial checks per flag:
  - source-url traceability
  - citation binding
  - record binding
  - arithmetic support where applicable
- Produces challenge score + disposition (`DEFENSIBLE`, `NEEDS_REVIEW`, `WEAK_SIGNAL`).

### 4) Retained Briefing Output (revenue layer)
- Endpoint: `GET /api/public-risk/briefing?cadence=weekly|monthly|quarterly&agencies=...`
- Returns a ready-to-send package:
  - scoped metrics
  - top findings
  - concrete action items
- This is designed for monthly retainers, not one-off dashboard usage.

## Existing route enhanced
- `GET /api/public-risk` now includes:
  - vendor entity count
  - defensibility summary
  - evidence graph summary

## UI visibility
- Internal and public risk dashboards now show defensibility/challenge scores.

## Next hardening steps
1. Persist evidence graph + challenge snapshots in Postgres.
2. Add page-level quote span extractor for real PDF parse output.
3. Add manual override workflow for entity resolution.
4. Add client-specific watchlists and scheduled briefing delivery.
