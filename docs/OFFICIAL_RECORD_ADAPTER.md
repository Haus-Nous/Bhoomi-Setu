# Synthetic official-record adapter

## Implemented now

Phase 18 implements a server-side, deterministic synthetic-provider flow:

```text
Official record lookup UI
  → OfficialRecordService
  → OfficialParcelRecordProvider role
  → SyntheticOfficialParcelRecordProvider
  → normalized OfficialParcelRecord
  → deterministic identity matching
  → idempotent case-linked import
  → case-scoped read path
```

The current provider class is named `SyntheticOfficialParcelRecordProvider`. It is the implemented provider boundary; a separate TypeScript interface named `OfficialParcelRecordProvider` is not currently declared. Its two operations are search by normalized parcel identifiers and retrieval by fixture ID.

All fixtures are deterministic and fictional. They carry `SYNTHETIC_OFFICIAL_FIXTURE` provenance, provider `synthetic`, a stable source reference, and `authoritative: false`.

Imports are stored as a snapshot in `case_official_records`, keyed by the selected `case_id` and `official_record_id`. A retry returns the existing snapshot with `alreadyImported: true`; it does not duplicate a link, create an ordinary document, or alter verification.

Identity matching is deterministic code, not AI:

- `EXACT_MATCH`: district, circle, mauza, Khata, and available Khesra align.
- `PARTIAL_MATCH`: the selected case has no Khesra but the remaining identity aligns.
- `MISMATCH`: location, Khata, or available Khesra differs. The import is rejected.

## Future / not implemented

A future lawful adapter might have this shape:

```text
OfficialRecordService
  → BiharGovernmentRecordProvider (future)
```

It is not implemented. BhoomiCheck currently has no live Bihar integration, government URL, scraping client, undocumented API use, credential flow, OTP flow, or submission path.

Before any future provider could be considered, it would require:

- documented lawful and authorized access;
- provider terms, consent, privacy, and data-minimization review;
- explicit authentication and authorization design, if required;
- a maintained schema mapping with source/provenance preservation;
- rate-limit, retry, timeout, and safe error-handling policy;
- reliability monitoring and auditable retrieval records; and
- product review ensuring results cannot be mistaken for legal or authoritative conclusions.

## Boundaries

The synthetic record is context only. It never overwrites citizen-side documents, changes ownership, submits anything to an authority, or becomes a Phase 17 parcel-area source. Gemini and OpenAI are not required for lookup, matching, import, or read behavior.
