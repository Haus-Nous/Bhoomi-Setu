# BhoomiCheck Demo Script

## Before recording or presenting

- Start the local application with `npm run dev` and open `http://localhost:3000`.
- Use only the seeded fictional hero case, `demo-family-001`.
- Keep the global synthetic/prototype notice visible where practical.
- Do not import, submit, or describe any artifact as a government record or legal conclusion.
- Optional AI keys are not required for this story. If no extraction provider is configured, do not demonstrate extraction as a dependency.

## 2–3 minute narrated demo

### 0:00–0:20 — proposition

**Show:** Landing page.

**Say:**

> Land-survey preparation can leave families with historical papers, family information, survey records, and parcel information that are difficult to compare. BhoomiCheck is an independent synthetic-demo assistant that organizes that evidence before anyone takes an outside action. It is not a government portal and it does not make legal decisions.

Point briefly to the hero proof: `DEMO-128 / DEMO-456`, historical 1.20 acre, survey 1.02 acre, mapped 1.0243 acre.

### 0:20–0:40 — unified case

**Show:** `demo-family-001` Dashboard.

**Say:**

> This is the selected synthetic case. The dashboard gives the citizen one place to see their stage, evidence, verification state, and a single recommended next step rather than a collection of disconnected portals.

### 0:40–1:00 — evidence

**Show:** Documents.

**Say:**

> The documents view first separates core case evidence from imported context and optional supporting material. A citizen can inspect source text and extraction status. Any AI extraction is only a candidate-fact step; the system keeps source evidence and does not let a model decide a discrepancy.

Optional: open one **Inspect fields** panel and its traceability disclosure. Do not run live extraction unless a configured demo provider is known to work.

### 1:00–1:25 — deterministic verification

**Show:** Verification.

**Say:**

> Verification is deterministic. For the hero case, BhoomiCheck finds a potential area difference and a family-context difference, with source-linked evidence. When a required fact is missing, the system says insufficient evidence instead of making something up.

### 1:25–1:55 — Parcel Intelligence

**Show:** Parcel Intelligence.

**Say:**

> This is the central comparison moment. BhoomiCheck keeps three independent synthetic area perspectives: the historical document at 1.20 acres, the survey/Parcha at 1.02, and geometry calculated from synthetic GeoJSON at about 1.0243. Historical differs from both; survey and geometry closely align. That is a traceable pattern for review, not a decision about which record is legally correct.

Point to the pairwise comparisons and open one traceability disclosure.

### 1:55–2:15 — official-record boundary

**Show:** Official Records; run the prefilled synthetic search if needed.

**Say:**

> This screen demonstrates a future provider boundary safely. The result is a synthetic official-style fixture—not retrieved from a live government system, not authoritative, and never submitted anywhere. Its identity match is deterministic and its provenance remains available for inspection.

Do not describe the fixture as official or click Import unless demonstrating the existing local, idempotent context-link behavior.

### 2:15–2:35 — Earth Observation context

**Show:** Earth Observation.

**Say:**

> The two dated scenes are synthetic contextual imagery. They offer a careful way to discuss change context, but they are not cadastral or legal evidence and they cannot change the verification result or area comparison.

### 2:35–2:50 — next step and packet

**Show:** Next Action, then the review-packet entry point.

**Say:**

> Instead of submitting anything automatically, BhoomiCheck turns the evidence into a practical preparation step. A review packet is a local MOCK preparation artifact, never a government claim, objection, or submission.

### 2:50–3:00 — close

**Show:** Architecture diagram in the README or Parcel Intelligence.

**Say:**

> BhoomiCheck separates AI-assisted extraction from deterministic verification, keeps evidence and provenance traceable, and demonstrates future provider boundaries without pretending to have live government access. Every demo record is synthetic.

## 30-second backup demo

**Show:** Landing → Dashboard → Verification → Parcel Intelligence → Next Action.

**Say:**

> BhoomiCheck turns fragmented synthetic land evidence into a traceable, deterministic comparison and practical preparation guidance. In this hero case, a 1.20-acre historical record differs from the 1.02-acre survey/Parcha and 1.0243-acre mapped synthetic geometry, while survey and geometry closely align. The system flags a potential issue for review—not a legal conclusion—and guides the citizen to prepare the next step without submitting anything.

## Presenter guardrails

- Say **synthetic official-style record**, never “live official record.”
- Say **potential difference** or **needs review**, never “wrong record” or “verified owner.”
- Say **contextual imagery**, never “satellite proof” or “encroachment detection.”
- Say **local MOCK review packet**, never “claim submitted.”
