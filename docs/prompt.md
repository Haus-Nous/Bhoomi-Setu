# Frozen product target

## Goal

Build Bhoomi Setu: a fixture-driven system that turns a tehsil's legacy land records and cadastral maps into searchable, validated, citizen-facing evidence records, where every extracted field is grounded in its source, every automated outcome is a deterministic check or calibrated proposal, and every consequential uncertainty is routed to a named officer rather than presented as a legal conclusion.

## Non-goals — build none of these, however tempting

- On-chain title transfer or tokenised property.
- Smart contracts that execute a transfer.
- A public blockchain as the primary ledger.
- Any AI-generated legal conclusion.
- Storage of Aadhaar numbers or biometrics, or mandatory Aadhaar.
- Online fine-tuning in production.
- Photorealistic 3D city rendering.
- Automatic merging of matched entities.
- Live scraping of government portals during the demo.
- Any ownership guarantee, automated adjudication, or self-executing mutation.

## Hard constraints

- Median officer review MUST complete in under 60 seconds using keyboard only.
- The verifier MUST load in under 2 seconds on simulated 3G, be fully static, and work with JavaScript disabled.
- Extraction is the only service permitted to require a GPU; all other services MUST run CPU-only.
- Every demo path MUST run solely from `fixtures/` with external network access disabled.
- Every field and conclusion MUST retain source provenance and uncertainty.
- State terminology, schema, units, tenure, and rules MUST be adapter-driven and versioned.
- Shares MUST use exact integer numerator/denominator arithmetic.
- Bad or contradictory evidence MUST cause abstention or a flag, never invention.
- Two state adapters ship: Bihar and Maharashtra; a third MUST be addable as configuration.
- `docs/LEGAL.md` and `docs/DOMAIN.md` govern every feature.

## Deliverables — all must exist to be done

1. Ingest with a quality gate returning per-page verdicts and a rescan list.
2. Extraction producing grounded, calibrated, schema-valid field proposals.
3. A rule pack with named, versioned rules and per-rule fixtures.
4. A triage queue ranked by expected value of review.
5. A split-screen, bidirectionally grounded, keyboard-first verification console.
6. A conflict engine covering six families with dossier export.
7. A citizen app containing My Land, parcel view, lineage graph, and exact share ledger.
8. Merkle anchoring, a static verifier, and an evidence-certificate generator.
9. RBAC with row-level security, consent guards, and a hash-chained audit log.
10. Dashboards covering the brief's six metrics plus calibration and cycle time.
11. An OpenAPI surface with an LADM mapping conformance test.

## Done when — mechanical checks only

- `just check`, `just test`, and `just eval` exit zero.
- Every deliverable has a passing acceptance test identified in `docs/plans.md`.
- `just demo` completes offline using only `fixtures/`.
- Browser tests prove the officer and verifier performance constraints.
- `docs/QUALITY.md` contains no module grade below B.
