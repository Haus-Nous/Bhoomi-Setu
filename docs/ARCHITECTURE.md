# BhoomiCheck architecture

## Judge-facing static overview

![BhoomiCheck synthetic-demo architecture and data flow](architecture-diagram.svg)

The static diagram is a repository-renderable overview for the submission package. It deliberately labels official-record and Earth Observation providers as synthetic boundaries and keeps contextual information separate from deterministic verification truth.

## Implemented prototype flow

```mermaid
flowchart LR
  UI[Citizen UI] --> CS[CaseService]
  CS --> API[Next.js API routes]
  API --> APP[Application / domain services]
  APP --> DB[(SQLite locally / Supabase Postgres when hosted)]
  APP --> GEO[ParcelIntelligenceService]
  GEO --> PG[Validated synthetic ParcelGeometry]
  PG --> MAP[Client-side MapLibre / BasemapProvider]
  APP --> PREP[PreparedDocument]
  PREP --> EXT[Optional ExtractionService]
  EXT --> AI[Configured Gemini or OpenAI provider]
  APP --> VER[VerificationService]
  VER --> GUIDE[GuidanceService]
  GUIDE --> PACKET[ReviewPacketService]
  APP --> GOV[GovernmentAdapter]
  GOV --> MOCK[MockGovernmentAdapter]
```

The selected route is the case identity. UI components consume `CaseDetail`; they do not read SQLite, Postgres, or fixture files directly. The client `CaseService` calls typed case-scoped API routes. `PROTOTYPE_MODE = "synthetic-demo"` constrains new synthetic case inputs and approved fixture selection before persistence. Application services assemble persisted synthetic rows, deterministic verification, derived guidance, packets, and honest timeline state into the response.

## Document and verification flow

```mermaid
flowchart TD
  F[Approved synthetic fixture] --> D[Persisted document]
  D --> P[PreparedDocument]
  P --> E[Optional model candidate extraction]
  E --> V[Schema + span + semantic grounding validation]
  V --> X[Persisted extraction attempt]
  D --> R[Deterministic VerificationService]
  R --> G[GuidanceService]
  R --> K[Case-scoped review packet]
```

Extraction is optional and can suggest only grounded candidate facts. `VerificationService` does not use an LLM: it strictly parses supported acreage and compares an explicit family comparison subject with the survey holder. It persists `PASS`, `POTENTIAL_ISSUE`, or `INSUFFICIENT_EVIDENCE` with source-document references.

## Government boundary

`GovernmentAdapter` is server-only. The sole implementation is `MockGovernmentAdapter`, which derives synthetic process context locally and makes no network request. No official adapter, scraping, credentials, OTP flow, or submission path exists.

## Geospatial boundary

`SyntheticParcelGeometryProvider` is represented by deterministic seed geometry persisted as `parcel_geometries`. `GeospatialService` validates GeoJSON and calculates area independently from imagery. A future authorized boundary is `GovernmentAdapter → CadastralParcelProvider → ParcelGeometry`; it is not implemented. `BasemapProvider` and future `ImageryProvider` affect visualization/context only and do not determine parcel geometry or discrepancies.

## Phase 18 synthetic official-record context

```mermaid
flowchart TD
  LOOKUP[Official-record lookup UI] --> SERVICE[OfficialRecordService]
  SERVICE --> PROVIDER[Provider role]
  PROVIDER --> SYNTHETIC[SyntheticOfficialParcelRecordProvider]
  SYNTHETIC --> RECORD[Normalized OfficialParcelRecord]
  RECORD --> MATCH[Deterministic identity matching]
  MATCH --> STORE[Idempotent case_official_records snapshot]
  STORE --> READ[Case-scoped read route]
  READ --> DASH[Dashboard context]
  READ --> DOCS[Documents imported-record section]
  READ --> PARCEL[Parcel Intelligence context]
```

`SyntheticOfficialParcelRecordProvider` is the only implemented provider. It returns fixed, fictional `OfficialParcelRecord` fixtures and makes no network request. The provider role is deliberately narrow—search by district/circle/mauza plus Khata or Khesra, then retrieve a selected fixture by ID—so a future lawful provider can be considered without coupling UI components to fixture data.

The service deterministically compares the selected record with the selected case parcel and location. A mismatch is rejected; an exact or partial match is persisted as an `ImportedOfficialRecord` snapshot. The database uniqueness constraint on `(case_id, official_record_id)` makes import idempotent. The read endpoint verifies the case exists and exposes only records linked to that case.

### Deliberate separation of record concepts

1. **Ordinary case documents** live in `documents`. They are bundled synthetic citizen-side fixtures, can be prepared/extracted, and feed the existing verification/document experiences.
2. **Imported synthetic official-style records** live separately in `case_official_records`. They are immutable context snapshots with provider, provenance, source-reference, authority, and identity-match data. They are not uploaded files and are never appended to `CaseDetail.documents`.
3. **Phase 17 parcel-area sources** remain exactly three deterministic sources: a historical/document record, a survey/Parcha record, and calculated mapped geometry.

Imported official-style records are context only: they are not a fourth area source and cannot affect `areaSources`, `pairwiseComparisons`, `comparisonSummary`, or verification truth. Parcel Intelligence may display the imported-record context, but its deterministic comparison service does not read it.

## Synthetic earth-observation context

`EarthObservationService` has an `ImageryProvider` boundary with the in-repository `SyntheticImageryProvider` implementation. It emits a read-only `EarthObservationInsight` for a case-scoped route and UI. The deterministic context policy operates only on fixture metrics; no database table, AI call, external imagery request, or legal inference is involved. This is an independent contextual layer: it does not read or modify Phase 17 area sources, Phase 18 imports, or `VerificationService` results.

Phase 18 requires neither Gemini nor OpenAI. AI does not perform identity matching; that comparison and every import decision are deterministic server code.

## Evaluation and observability

The 12-case evaluation constructs synthetic document inputs and invokes the production `VerificationService`. Ground truth is declared independently; calculated metrics include correct/incorrect outcomes, FP/FN, and insufficient-evidence classification counts. Metrics are process-local and privacy-minimized; they are not production monitoring.

## Current limits

Implemented: Next.js UI/API, local SQLite persistence, a server-side Postgres/Supabase adapter for hosted configuration, bundled synthetic fixture attachment, optional server-side extraction, deterministic verification, bilingual presentation, guidance, local review packets, and a mock government boundary.

Mocked: all government workflow context and every document/person/parcel fixture.

Future, not implemented: authentication/session tenancy, object storage, queues/workers, production observability, migrations/backups, live government integration, and government submission. A real-data deployment must add an authenticated principal followed by authorization/case-ownership validation before exposing persistence. The lack of that boundary means this prototype must not be deployed as a shared case system.
# Parcel area comparison boundary

`ParcelIntelligenceService` derives a typed three-source area model from existing synthetic documents, survey text, and persisted geometry. `ParcelAreaComparisonService` normalizes supported units, applies the symmetric demo policy, and returns pairwise comparisons plus a deterministic summary. No comparison state is persisted and no UI component decides a status. This path is AI-independent and intentionally separate from deterministic verification rules.
