# API

All implemented routes are local Next.js route handlers in the enforced `synthetic-demo` profile. They operate on synthetic prototype data only and return JSON. Most read routes use `{ data }` and errors use `{ error: { code, message? } }`; search and import routes return their documented service result shapes directly. No route contacts a government system, accepts real uploads, or submits an application.

| Method | Route | Behavior |
| --- | --- | --- |
| `POST` | `/api/cases` | Creates a synthetic case from clearly labelled synthetic location/nickname fields, a `DEMO-...` Khata, and optional `DEMO-...` Khesra. Returns `201`; invalid/non-synthetic input returns `400 INVALID_INPUT`. |
| `GET` | `/api/cases/:caseId` | Returns the current `CaseDetail`, persisted documents/results/packets, derived guidance/timeline, and clearly labelled mock workflow context. Unknown cases return `404 CASE_NOT_FOUND`. |
| `GET` | `/api/cases/:caseId/parcel-intelligence` | Returns the selected case’s parcel identity, validated synthetic GeoJSON when available, deterministic geometry area, and contextual historical/survey areas. It never returns another case’s geometry and does not decide a discrepancy. |
| `GET` | `/api/cases/:caseId/documents` | Lists persisted documents scoped to the selected case. |
| `GET` | `/api/cases/:caseId/documents/fixtures` | Lists approved bundled synthetic fixture choices for an existing case. |
| `POST` | `/api/cases/:caseId/documents` | Strict `{ fixtureId }` attachment. First attachment returns `201`; repeat attachment reuses the case-scoped document and returns `200`. Invalid fixture input is `400`; unavailable fixture is `404`. |
| `GET` | `/api/cases/:caseId/documents/:documentId` | Returns a case-scoped document and its deterministic `PreparedDocument`; cross-case IDs return `404`. |
| `GET` | `/api/cases/:caseId/documents/:documentId/extract` | Returns the latest persisted extraction attempt or `null`. |
| `POST` | `/api/cases/:caseId/documents/:documentId/extract` | Runs optional configured extraction, validates evidence grounding, persists an attempt, and returns a safe result. Missing AI configuration is reported safely; no provider internals are exposed. |
| `POST` | `/api/cases/:caseId/verify` | Runs deterministic verification, replaces that case’s snapshot, and returns current results. |
| `GET` | `/api/cases/:caseId/verification` | Returns the persisted verification snapshot. |
| `GET` | `/api/cases/:caseId/review-packets` | Lists case-scoped local review packets. |
| `POST` | `/api/cases/:caseId/review-packets` | Creates or reuses a packet only for a persisted `POTENTIAL_ISSUE`. Creation is idempotent per `(caseId, verificationResultId)`. Invalid input is `400`; ineligible/cross-case results are `422`. |
| `GET` | `/api/cases/:caseId/review-packets/:packetId` | Retrieves a packet only inside its selected case; cross-case access is `404`. |
| `PATCH` | `/api/cases/:caseId/review-packets/:packetId` | Updates a `DRAFT` packet’s citizen notes/request or marks it ready. `READY_FOR_REVIEW` packets are frozen: content changes return `409 PACKET_LOCKED`; a repeated ready request is a safe no-op. |
| `POST` | `/api/demo/reset` | Resets exactly one approved seed case (`demo-family-001` or `demo-family-002`) to deterministic synthetic state. It rejects arbitrary case IDs and does not affect newly created cases. |
| `GET` | `/api/health` | Returns only safe synthetic-demo database availability status. |

The client’s `CaseService` is the UI fetch boundary. Nested resources are validated against the selected synthetic case, but this is resource scoping—not user authorization. The current prototype does not implement a user/session authorization boundary; opaque case IDs and case-scoped nested queries are not a substitute for production tenancy.

## Phase 18 synthetic official-record routes

These routes use only the deterministic SyntheticOfficialParcelRecordProvider. They make no live government request and require neither Gemini nor OpenAI.

### **POST /api/official-records/search**

The JSON request requires non-empty string values for district, circle, and mauza, plus at least one of khataNumber or khesraNumber. Each supplied field is trimmed and limited to 120 characters.

~~~json
{
  "district": "Demo District",
  "circle": "Demo Circle",
  "mauza": "Example Mauza A",
  "khataNumber": "DEMO-128",
  "khesraNumber": "DEMO-456"
}
~~~

Invalid JSON or invalid/incomplete fields return 400:

~~~json
{ "error": { "code": "INVALID_SYNTHETIC_SEARCH", "message": "District, circle, mauza, and either Khata or Khesra are required." } }
~~~

A valid request returns 200 with the actual shape:

~~~json
{
  "mode": "synthetic-demo",
  "provider": "synthetic",
  "query": { "district": "...", "circle": "...", "mauza": "...", "khataNumber": "...", "khesraNumber": "..." },
  "results": [
    {
      "id": "synthetic-official-hero-001",
      "sourceProvider": "synthetic",
      "provenance": "SYNTHETIC_OFFICIAL_FIXTURE",
      "sourceReference": "BHOOMICHECK-SYNTHETIC-OFFICIAL-001",
      "parcelIdentity": { "district": "...", "circle": "...", "mauza": "...", "khataNumber": "...", "khesraNumber": "..." },
      "recordData": { "recordedArea": 1.2, "recordedAreaUnit": "acre", "normalizedAreaAcres": 1.2, "holderNames": ["..."], "recordType": "...", "surveyStage": "...", "remarks": "..." },
      "sourceMetadata": { "retrievedAt": "...", "displayName": "Synthetic official-style record", "syntheticNotice": "...", "authoritative": false }
    }
  ]
}
~~~

An exact lookup returns one fixture. The intentional ambiguous fixture returns multiple candidates for explicit UI selection. A valid lookup with no fixture returns 200 and an empty results array. It means only that no synthetic fixture matched; it does not imply a real land record does not exist.

### **POST /api/cases/:caseId/official-records/import**

The request body is:

~~~json
{ "officialRecordId": "synthetic-official-hero-001" }
~~~

The service retrieves the selected case and fixture and deterministically matches district, circle, mauza, Khata, and available Khesra. It does not use AI. On a first matching import, 200 returns:

~~~json
{
  "imported": {
    "id": "demo-family-001-synthetic-official-hero-001",
    "caseId": "demo-family-001",
    "officialRecordId": "synthetic-official-hero-001",
    "provider": "synthetic",
    "provenance": "SYNTHETIC_OFFICIAL_FIXTURE",
    "sourceReference": "BHOOMICHECK-SYNTHETIC-OFFICIAL-001",
    "identityMatch": "EXACT_MATCH",
    "record": { "...": "complete OfficialParcelRecord snapshot" },
    "importedAt": "..."
  },
  "alreadyImported": false,
  "mismatch": false
}
~~~

A repeated import returns the same persisted snapshot with alreadyImported true. A mismatch returns 409 with:

~~~json
{ "mismatch": true, "identityMatch": "MISMATCH" }
~~~

A missing or non-string officialRecordId returns 400 INVALID_IMPORT. An unknown case or fixture returns 404 NOT_FOUND. A record is linked only to the selected case and preserves provider, provenance, source reference, authority metadata in the snapshot, and identity-match traceability.

### **GET /api/cases/:caseId/official-records/import**

This is the persisted, case-scoped read path used by Dashboard, Documents, and Parcel Intelligence context components. A known case returns 200:

~~~json
{ "data": [/* ImportedOfficialRecord snapshots for this case only */] }
~~~

Before import, data is an empty array. An unknown case returns 404:

~~~json
{ "error": { "code": "NOT_FOUND", "message": "The synthetic case was not found." } }
~~~

The route never exposes another case’s links and never changes ordinary documents, verification results, or Phase 17 area-comparison data.

## `GET /api/cases/:caseId/earth-observation`

Returns read-only deterministic synthetic contextual imagery for a known case. The response contains the parcel identity, zero or two `ImagerySnapshot` fixtures, deterministic context indicators, an overall classification, policy identifier, provenance, and explicit `synthetic=true`, `authoritative=false`, `legalEvidence=false` safety metadata. It performs no network, AI, or government-provider request.

`demo-family-001` returns two snapshots and `NOTICEABLE_CHANGE`; `demo-family-002` returns a stable pair; a known case without a fixture returns 200 with `INSUFFICIENT_EVIDENCE`; an unknown case returns 404. This API is not an area source and cannot change Phase 17 comparison or verification output.
# Parcel intelligence comparison fields

`GET /api/cases/:caseId/parcel-intelligence` retains `parcel`, `geometry`, `calculatedArea`, and `recordedAreas`, and also returns `areaSources`, `pairwiseComparisons`, `comparisonSummary`, and `comparisonPolicy`. Each source carries raw and normalized values plus source traceability. Pairwise results use the `BHOOMICHECK_DEMO_AREA_V1` demo-only policy and do not change verification results.
