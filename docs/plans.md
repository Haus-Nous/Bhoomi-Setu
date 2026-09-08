# Milestone plan

## Operating rule

Complete milestones in order. After each milestone run its exact validation command. If validation fails, stop and repair it immediately; do not move forward or batch the failure.

## M0 — Harness and durable memory

- **Build:** repository harness; durable memory; `docs/DOMAIN.md` and `docs/LEGAL.md`; command surface; blocking CI; and all twelve custom linters/structural invariant tests specified for Session 0.4.
- **Acceptance:** `just setup && just check && just test` exits zero; AGENTS.md is at or below 120 physical lines; a blocking CI definition is present; all twelve linters/structural tests are implemented; every linter has both a violating/firing test proving detection and a valid/non-firing test proving it does not false-positive; the complete linter suite runs through `just check` and CI.
- **Validation:** `just setup && just check && just test`
- **Demo checkpoint:** list the monorepo and run the green local gate; no user UI yet.

## M1 — Golden set and evaluation

- **Build:** fixture bands, 60 double-verified pages, seeded errors, six metric gates, leak check, eval report.
- **Acceptance:** full band table is generated; seeded threshold regression fails with a named metric; training/eval overlap fails.
- **Validation:** `just eval`
- **Demo checkpoint:** run the frozen golden set offline and show the band report.

## M2 — Ingest, quality, provenance

- **Build:** A1 batch integrity/resume/content addressing; A2 page quality/rescan; A3 type/script/hand routing; A4 restoration; B6 provenance hash chain.
- **Acceptance:** fixture 200-page batch yields routing and rescan manifests; interrupted upload resumes without loss; one query reconstructs page history.
- **Validation:** `just test`
- **Demo checkpoint:** reject named bad fixture pages within seconds and export their rescan list.

## M3 — Rules and exact validation

- **Build:** C1 restricted YAML evaluator and 24 rules/eight families/three fixtures each; C2 district area reconciliation; F4 exact share ledger; rule catalogue.
- **Acceptance:** every rule has pass/fail/not-applicable fixtures; 500 generated subdivision sequences preserve exact shares; replay changes exceptions when a rule is disabled.
- **Validation:** `just test`
- **Demo checkpoint:** replay one fixture village and explain named area/share outcomes.

## M4 — Grounded extraction

- **Build:** B1 layout/tables/margin notes; B2 OCR ensemble; B4 schema-constrained extraction; B5 calibration; optional B3 handwriting path.
- **Acceptance:** evaluation floors pass; every field has a tested source pointer; nonexistent village input abstains or returns low confidence; reliability data is generated.
- **Validation:** `just eval`
- **Demo checkpoint:** extract one mixed-script fixture page and jump from each proposal to its source.

## M5 — Triage and officer verification

- **Build:** D1 expected-value triage; D2 split-screen grounding; D3 distinct-signer four-eyes; D4 correction capture.
- **Acceptance:** browser test verifies ten records keyboard-only with median <60 seconds; server rejects self-approval; corrections retain labelled crops.
- **Validation:** `just test`
- **Demo checkpoint:** keyboard-review a high-value record and route it to a different signer.

## M6 — Spatial evidence

- **Build:** E1 vectorisation/number association; E2 georeferencing/residuals; E3 topology/sliver filtering; E4 dated/source-labelled explorer.
- **Acceptance:** fixture fabric reduces raw intersections to asserted conflicts; residual map renders; planar-area structural test passes.
- **Validation:** `just test`
- **Demo checkpoint:** overlay a historical sheet and explain one residual-aware conflict.

## M7 — Identity, lineage, conflicts, citizen

- **Build:** F1 consent binding/revoke; C4 guarded entity resolution; F2 lineage; F3 advisory succession; C5 continuity; J7 conflict dossier; citizen views; optional E5 extrusion.
- **Acceptance:** revoked consent denies and audits; simulator shows recorded/suggested/difference with citations; near-match merge is refused; fixture dossier PDF validates.
- **Validation:** `just test`
- **Demo checkpoint:** trace a lineage, show exact shares, revoke consent, and export a conflict dossier.

## M8 — Trust and static verification

- **Build:** G1 integrity store; G2 Merkle batching/AnchorProvider; G3 selective credential; G4 evidence certificate; static verifier.
- **Acceptance:** inclusion proof verifies fixture record 1,447 of 2,000; one-byte change visibly fails; verifier loads <2 seconds on simulated 3G with JavaScript disabled; certificate assertions have provenance.
- **Validation:** `just test`
- **Demo checkpoint:** scan/share a fixture proof, verify offline, tamper one byte, and show divergence.

## M9 — Governance, APIs, dashboards, demo

- **Build:** H1 RBAC/RLS; H2 hash-chained read/write audit; H3 eight drillable metrics; H4 OpenAPI/LADM test; H5 tracing; Maharashtra adapter; eight-minute fixture demo.
- **Acceptance:** cross-circle database query returns no rows; deleted audit row breaks verification; third-state adapter is configuration-only; all 11 deliverables have named passing tests; network-disabled demo exits zero.
- **Validation:** `just demo`
- **Demo checkpoint:** run the complete eight-minute journey solely from `fixtures/` with external network disabled.

## Decision notes

- M0–M9 order is fixed; M5 and M6 may run in isolated worktrees but merge gates remain ordered.
- Domain/legal memory overrides attractive feature ideas.
- State behavior is adapter data, not branching core logic.
- Extraction is the only GPU service.
- Validation is deterministic; AI emits proposals, never legal conclusions.
- Historical sources and annotations are immutable; corrections append events.
- Change a decision only with new evidence, and record the replacement and reason here.

## Cut list if behind — cut in this order

1. B3 handwriting path; flag degraded pages for rescan.
2. E5 extrusion.
3. G3 selectively disclosable credentials; retain raw hash verification.
4. Second state adapter. The Maharashtra/second-state adapter may be deferred from a time-boxed hackathon submission under schedule pressure, but this is submission-scope deferral only: Bhoomi Setu does not satisfy the frozen final product target or final Done-when criteria until both Bihar and Maharashtra adapters ship.
5. C6 anomaly signals.

Never cut M0, M1, M4 grounding, M5 four-eyes, or M9 RBAC.
