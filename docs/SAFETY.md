# BhoomiCheck Safety, Privacy, and Prototype Boundaries

## Hard boundaries

This repository is an independent hackathon prototype using synthetic/mock data only. It must not:

- access, scrape, crawl, reverse-engineer, or automate government websites or undocumented APIs;
- submit, track, or prepare an actual government application, claim, objection, payment, or OTP flow;
- request, receive, retain, or process real Aadhaar, PAN, bank/payment, or private land-record data;
- determine legal ownership, inheritance rights, title validity, or legal outcomes; or
- claim Government of Bihar affiliation, endorsement, operation, or branding.

## Implemented safeguards

- `PROTOTYPE_MODE = "synthetic-demo"` is a centralized server-side boundary. Case creation rejects non-`DEMO-...` identifiers and unlabelled/prohibited sensitive-looking case text; it is not an identity system.
- The UI identifies the product as an independent prototype using synthetic demo data and not legal advice.
- Seeded records and attachable fixtures are synthetic and labelled with demo identifiers.
- The current document path attaches only bundled fixtures; there is no arbitrary file-upload endpoint.
- `MockGovernmentAdapter` has no network behaviour and labels its output synthetic/non-official.
- Verification uses terms such as `POTENTIAL_ISSUE` and `INSUFFICIENT_EVIDENCE`; it does not pronounce a record invalid or name an owner.
- Every verification result keeps its source document references and evidence text.
- The review packet is a local MOCK preparation record. Marking it ready for review freezes local editing; it does not send, export, print, or submit anything.
- Demo reset is limited to the two built-in seed IDs and is not a generic delete operation; it cannot target an arbitrary created case.
- Parcel geometry is restricted to server-seeded fictional GeoJSON. It is labelled synthetic, is not an official cadastral boundary, and is never used to infer ownership, possession, encroachment, or a legal result.

## Phase 18 official-record boundary

- Official-record lookup uses only server-bundled synthetic fixtures. It does not scrape, call, or search a live Bihar government system or any real citizen record source.
- Every fixture is explicitly non-authoritative: its metadata is `authoritative=false` and its provenance is `SYNTHETIC_OFFICIAL_FIXTURE`.
- Importing a fixture is only a local, case-scoped context link. It does not modify government records, submit anything to an authority, change ownership, or create legal evidence.
- Imported official-style records are stored separately from ordinary citizen-side documents. They never overwrite, replace, or silently append to the `documents` collection.
- The import does not alter deterministic verification truth. It also cannot alter Phase 17 area sources, pairwise comparisons, or comparison summary; Phase 17 stays limited to historical/document, Survey/Parcha, and mapped-geometry sources.
- Identity matching is deterministic server code. Gemini and OpenAI are not required and do not decide whether a match, mismatch, or import exists.

The safe no-match message, **“No synthetic fixture matches these identifiers.”**, means only that the bundled demo fixtures contain no match. It never means that no real land record exists.

## Extraction and AI guardrails

Gemini or OpenAI extraction is optional, server-side, and only applicable to synthetic fixture text. The selected provider may suggest structured candidate fields, but accepted fields require schema validation, evidence-span validation, and semantic grounding against labelled source text. The deterministic verification service—not an LLM—decides whether a comparable discrepancy exists.

The application does not send arbitrary user uploads to a model provider because arbitrary uploads are not supported. Provider errors return safe citizen-facing failures without credentials, stack traces, database paths, raw SQL, or provider internals.

## Current local-data limitation

Case state is stored in local SQLite for the prototype. The application has no authentication, session boundary, tenant isolation, production retention/deletion workflow, encryption-at-rest deployment configuration, or production incident-response controls. Case-scoped resource validation prevents a nested document or packet ID from being used under a different selected case; it is not privacy, access control, or tenant isolation. Do not use it with real information.

## Future work, explicitly not implemented

Future production work would need authenticated access, tenant isolation, managed encrypted storage, retention controls, redacted telemetry, controlled uploads, malware/content checks, human review, and approved documented government interfaces. Those controls cannot be inferred from the current local prototype.

## Misuse review

| Risk | Current mitigation |
| --- | --- |
| Output is treated as official or legal | Persistent prototype language, non-legal wording, source traceability, and no submission path |
| Real records are added | Bundled synthetic fixtures only; no arbitrary upload control |
| Extraction invents a fact | Candidate validation, source spans, semantic grounding, and accepted-fact persistence boundary |
| A missing fact becomes a false discrepancy | Deterministic `INSUFFICIENT_EVIDENCE` outcome |
| Government affiliation confusion | Independent brand, no government logos, no live integration |
| Synthetic map is mistaken for a cadastral record | Persistent synthetic-boundary wording, no real geometry source, and no map-derived legal/discrepancy result |
| Cross-user privacy expectation | Explicit local-prototype limitation; P1-09 authentication/session/tenancy is deferred |

## Release checklist

- [ ] All visible fixtures, people, identifiers, maps, and parcels are synthetic.
- [ ] No live government URLs, API clients, scraping code, or official logos are added.
- [ ] No secrets or `.env` files are committed.
- [ ] No screen describes a potential issue as a legal conclusion.
- [ ] New documentation distinguishes implemented prototype behaviour from future production work.
- [ ] Any future upload or export feature is reviewed against these boundaries before implementation.
# Synthetic parcel comparison safety

Parcel Intelligence uses only synthetic documents and synthetic GeoJSON. Its area tolerances are illustrative demo policy, not government, legal, statutory, cadastral, or measurement standards. A mapped boundary is contextual and does not prove ownership, possession, encroachment, or record correctness.

## Synthetic imagery context

Earth-observation visuals are locally generated synthetic context scenes, not satellite, government, cadastral, or Google imagery. Their deterministic indicators are presentation context only. They do not establish ownership, possession, encroachment, construction legality, boundary correctness, mutation, or official survey status; they do not affect verification or area comparison. No external imagery API, provider token, scraping, or machine analysis of third-party map tiles is used.
