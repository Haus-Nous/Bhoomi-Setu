# Persistence

Local development uses Node's built-in SQLite (`data/bhoomi-check.sqlite`). The schema has foreign-keyed tables for each case aggregate, plus indexes on document and parcel case IDs. The database is seeded once with the two fictional demo cases and persists newly created cases across normal reloads. `PROTOTYPE_MODE = "synthetic-demo"` permits only `DEMO-...` identifiers, labelled synthetic case text, and registry-backed fixture documents. This is prototype-local persistence; it is not a government system, private user storage, or multi-user case management and must contain synthetic data only.

Phase 4 adds the non-destructive `document_extractions` table. Each row stores document/case identity, completed or failed status, validated structured output when available, provider/model metadata, timestamp, and a safe failure code/message. API keys and raw document secrets are never stored.
