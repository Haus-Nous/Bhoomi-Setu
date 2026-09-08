# Data model

## Persisted local prototype state

Local development stores synthetic case aggregates in Node SQLite at `data/bhoomi-check.sqlite`, which is ignored by Git. Hosted Vercel requests use the identical aggregate-table model in Supabase Postgres, initialized by `supabase/schema.sql`.

| State | Persistence | Notes |
| --- | --- | --- |
| Case, people, relationships, parcels, survey record | Case aggregate tables keyed by `case_id` | `CaseApplicationService` assembles these into `CaseDetail`. |
| Documents | `documents` | Each document contains synthetic metadata, canonical source text, processing state, and deterministic fields. An approved fixture attachment has a deterministic case-and-fixture ID and is idempotent per case. |
| Extraction attempt | `document_extractions` | Immutable completed/failed attempt with case/document IDs, provider/model, prompt version, timestamp, safe failure metadata, and accepted grounded result when completed. |
| Verification snapshot | `verification_results` | Replaceable deterministic result set per case. Each item retains rule ID, outcome, source document IDs, compared values, evidence, and confidence. |
| Review packet | `review_packets` | Local synthetic draft linked to one verification result. It retains source verification/document IDs, compared values, citizen notes/request, timestamps, and `DRAFT` or `READY_FOR_REVIEW` status. |
| Timeline events | `timeline_events` | Persisted case activity plus packet events. It is citizen-facing history, not a technical audit log. |
| Parcel geometry | `parcel_geometries` | Case- and parcel-scoped portable GeoJSON text, source/provenance reference, and timestamps. Seed rows are synthetic only; no PostGIS requirement exists. |
| Imported synthetic official-style record | `case_official_records` | A case-scoped snapshot of a selected synthetic provider fixture, kept separate from ordinary documents and parcel-area comparison inputs. |

`READY_FOR_REVIEW` means a local packet snapshot is frozen; it is never submitted, received, or approved by any government system. The packet service reuses the earliest packet for a case/result pair rather than generating duplicate drafts.

The controlled demo reset deletes and recreates state only for the two server-defined seed IDs. It restores their synthetic aggregate, fixture documents, verification/packet/timeline state, and leaves every newly created synthetic case untouched.

## Phase 18 official-record model

An **OfficialParcelRecord** is a normalized synthetic provider result. It has a stable fixture identifier, provider (`synthetic`), provenance (`SYNTHETIC_OFFICIAL_FIXTURE`), and source reference. Its parcel identity contains district, circle, mauza, Khata number, and Khesra number. Its record data contains recorded area and unit, normalized acres, holder names, record type, survey stage, and remarks. Its source metadata contains a retrieval timestamp, display name, synthetic notice, and `authoritative: false`.

An **ImportedOfficialRecord** is the case-linked snapshot persisted after deterministic identity matching. It contains:

- its own stable import ID;
- the selected `caseId` and `officialRecordId`;
- provider, provenance, and source reference copied from the fixture;
- the identity result: `EXACT_MATCH`, `PARTIAL_MATCH`, or `MISMATCH`;
- the complete `OfficialParcelRecord` snapshot; and
- an import timestamp.

The physical table is:

```text
case_official_records(
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  official_record_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  UNIQUE(case_id, official_record_id)
)
```

`payload` is the serialized ImportedOfficialRecord snapshot. The uniqueness constraint makes a retry idempotent for the same case and fixture. The same fixture may be linked independently to a different matching case; a record linked to one case is not returned for another. This is synthetic prototype persistence, not a government-record database.

The table is intentionally not the `documents` table. Imported official-style records do not change the ordinary case document collection, extraction state, verification evidence, or Phase 17's three-source area model.

New synthetic cases have no automatically invented geometry. The parcel-intelligence read model therefore returns `geometry: null` and `calculatedArea: null` until an approved future geometry path exists.

## Derived read-model state

`CaseDetail.guidance` is derived deterministically from current verification results and existing documents; it is not separately persisted. The case API also builds a current timeline/read model, ensuring the dashboard and case screens consume the selected case’s persisted state.

`PASS`, `POTENTIAL_ISSUE`, and `INSUFFICIENT_EVIDENCE` are verification outcomes, not legal findings. Missing or unusable required evidence is persisted as insufficient evidence rather than a discrepancy.

## Configuration and boundaries

`survey-workflow.ts` and `MockGovernmentAdapter` are server-side configuration/boundaries, not government data. `MockGovernmentAdapter` derives clearly synthetic workflow context and makes no network call.

The database adapter selects local SQLite without `DATABASE_URL` and server-side Supabase Postgres when it is configured. Browser components never receive a database credential. This synthetic-demo prototype has no user/session tenancy, production migrations, managed backups, object storage, background workers, or production audit logging. Only synthetic data belongs in it.

## Earth-observation read model

Phase 19 adds typed `ImagerySnapshot`, `EarthObservationIndicator`, and `EarthObservationInsight` models. They are immutable provider fixture/read-model data, not database entities: no new table is required. Each snapshot carries provider, synthetic source type, local `synthetic://` asset reference, provenance, quality, `synthetic: true`, and `authoritative: false`. Indicators carry earlier/later values, a percentage-point delta, a deterministic classification, and policy provenance. This context model is intentionally absent from `ParcelIntelligence.areaSources`, pairwise area comparisons, verification results, and `CaseDetail.documents`.
