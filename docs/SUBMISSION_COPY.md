# BhoomiCheck Submission Copy

## Project title

**BhoomiCheck**

## Tagline

**Understand your land record before you act.**

## One-line description

### Short

A synthetic-first land-survey readiness assistant that turns fragmented records into traceable verification, parcel intelligence, and practical next-step guidance.

### Medium

BhoomiCheck is an independent synthetic-demo assistant for understanding a land-survey case before acting. It organizes evidence, separates AI-assisted extraction from deterministic verification, compares historical, survey, and mapped parcel areas, and guides preparation without claiming legal or government authority.

## Problem

### Short

Land-survey preparation often leaves citizens to reconcile fragmented historical records, family context, survey/Parcha data, and parcel information without a clear way to understand what agrees or what to review next.

### Medium

The hard part of land-survey preparation is often reconstructing one understandable case from multiple sources: old and current records, genealogy or inheritance context, survey/Parcha information, parcel geometry, and supporting documents. Citizens need to understand available evidence, identify potential differences, and prepare carefully—without assuming a portal or model can make a legal decision for them.

## Solution

BhoomiCheck creates one synthetic evidence workflow: case → documents → structured extraction → deterministic verification → parcel intelligence → contextual official-record/Earth Observation views → guided next action. It preserves source traceability and explicitly returns insufficient evidence when facts are missing.

## How it works

1. Open or create a clearly synthetic case.
2. Inspect grouped synthetic document evidence and optional extraction candidates.
3. Run deterministic source-backed area and family-context checks.
4. Compare exactly three parcel-area perspectives: historical/document, survey/Parcha, and mapped geometry.
5. Review synthetic provider context without treating it as authoritative.
6. Prepare a local MOCK review packet instead of submitting anything.

## Key features

- Evidence-first case reconstruction
- Optional AI-assisted structured extraction with validation and grounding
- Deterministic verification and honest insufficient-evidence states
- Family/inheritance context and synthetic Khanapuri Parcha
- Synthetic GeoJSON + Turf parcel-area comparison
- Synthetic official-record provider boundary with idempotent context linking
- Synthetic Earth Observation context separated from verification truth
- Guided preparation, review packet, English/Hindi interface

## What makes it unique

- AI can propose facts; deterministic code decides verification outcomes.
- Every important result remains traceable to source evidence.
- Parcel Intelligence compares three independent perspectives instead of treating a map as legal truth.
- Official-record and imagery provider abstractions are demonstrated safely with synthetic fixtures only.
- The product prefers `INSUFFICIENT_EVIDENCE` over fabricated certainty.

## Hero result

For synthetic case `demo-family-001`, the historical area (1.20 acre) differs from the survey/Parcha (1.02 acre) and mapped geometry (approximately 1.0243 acre), while survey and geometry closely align. This produces two `POTENTIAL_ISSUE` comparisons and one `CONSISTENT` comparison. It is evidence comparison, not a legal determination.

## Tech stack

Next.js 16, React 19, TypeScript, Zod, Node SQLite, Postgres/Supabase adapter, MapLibre, Turf, optional Gemini/OpenAI extraction providers, Vitest, ESLint, and Vercel-compatible route handlers.

## AI / Codex usage

Codex was used iteratively as an implementation and review agent across the phased build: application/service boundaries, optional extraction providers, deterministic verification, geospatial comparison, synthetic provider boundaries, persistence adapters, localization/accessibility, tests, and product QA. Gemini/OpenAI are optional extraction providers; neither determines verification or legal outcomes.

## Safety / synthetic data

This is an independent prototype using synthetic data only. It is not a government portal, does not retrieve live government records, does not submit anything, and does not determine ownership, title, inheritance, encroachment, or legal eligibility. Official-style records are non-authoritative synthetic context; Earth Observation is synthetic contextual imagery, not cadastral or legal evidence.

## Evaluation proof

The repository's synthetic evaluation suite contains 12 cases and 24 deterministic rule outcomes: 24/24 correct, 0 false positives, 0 false negatives, and 5/5 insufficient-evidence classifications. These figures describe only synthetic fixtures; they are not real-world accuracy claims.

## Future scope

Future work could add lawful, documented provider adapters; licensed/open imagery sources; stronger OCR; human review workflows; expanded Bihar document schemas; auditable rule packs; and broader localization. Real-data use would require authentication, authorization, tenancy, privacy controls, retention, and a separate safety review.

## Demo instructions

Open the verified public demo at [bhoomi-check.vercel.app](https://bhoomi-check.vercel.app), or run `npm install && npm run dev` locally and open `http://localhost:3000`. Begin with `demo-family-001` and follow Dashboard → Documents → Verification → Parcel Intelligence → Official Records → Earth Observation → Next Action. Use `demo-family-002` as the aligned control. No AI key is needed for the core demo.
