# Truth Artifact: Maryland Procurement Risk

## Use Case
- User: Maryland procurement analyst preparing BPW/BOE briefs.
- Job: Find and document high-confidence procurement risk signals with evidence traceability.
- Output: Decision-grade dossier with source URLs, statute citations, reproducible logic traces, and analyst adjudications.

## Product Truth Gates
- Time to first usable brief: `< 10 minutes`.
- Precision on top flags (human-reviewed): `>= 80%`.
- Traceability coverage: `100%` (source URL + citation + logic trace on each flag).
- One-click export: `/api/truth/maryland-procurement/dossier`.

## Moat Components
- Normalized entity graph:
  - Vendor alias collapse and canonical entity IDs.
  - Reused across scoring, pattern detection, and reporting.
- Auditable confidence stack:
  - Base confidence from rule logic.
  - Challenge score from reproducibility checks.
  - Calibration adjustment from analyst feedback.
- Historical memory:
  - Snapshot state hashes persist over time.
  - Diffs show added/resolved/changed signals and why it matters.
- Learning loop:
  - Analysts accept/reject findings with reasons.
  - Rule-level acceptance rates recalibrate confidence.

## Truth Over Hype
Every dossier must include:
- Top accepted signals.
- Rejected false positives.
- Why each rejection occurred and what rule needs refinement.
