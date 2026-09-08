## User request

Implement Phase 4 of BhoomiCheck: convert the existing deterministic `PreparedDocument` output into validated, evidence-backed structured land-record extraction using an OpenAI model.

Before changing code, inspect the current repository and read `AGENTS.md` if present plus `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/API.md`, `docs/PERSISTENCE.md`, `docs/SYNTHETIC_DATA.md`, `docs/DOCUMENT_PIPELINE.md`, and `docs/SAFETY.md` / `docs/PRODUCT.md` if present. Treat Phases 1–3 and the P0 remediation as completed architecture; do not redesign unrelated functionality.

## Objective and bounded pipeline

Build this pipeline:

Persisted synthetic document → `PreparedDocument` → `ExtractionService` → OpenAI structured extraction → runtime schema validation → evidence-backed `ExtractedDocument` → persisted extraction result / API → existing document UI.

The goal is to transform synthetic prepared document text into structured facts that can later be compared deterministically, not to make legal conclusions.

## Required extraction contract

Design a typed `ExtractedDocument` / `DocumentExtraction` contract appropriate to the existing domain model. Extract only facts explicitly supported by `sourceText`, where applicable: document type; person/holder names; relationship references; khata identifier; khesra/plot identifier; recorded area; area unit; mauza/location labels; survey/reference identifiers; and record/reference dates when explicitly present.

Do not force every document type to contain every field. Each extracted factual value must retain evidence sufficient to trace it back to the `PreparedDocument` source. Prefer a concept like field/value/confidence/evidence source quote or span, adapted to the existing architecture.

## OpenAI integration

Create a clean AI provider boundary. Do not call OpenAI directly from React components or route handlers. Prefer `DocumentApplicationService` → `ExtractionService` → `ExtractionProvider` interface → `OpenAIExtractionProvider`, unless the repository has a better convention.

Use the current official OpenAI JavaScript/TypeScript SDK and structured model output where practical. Read `OPENAI_API_KEY` from environment configuration; never commit a key. Add or update `.env.example` with the variable name but no secret. If `OPENAI_API_KEY` is unavailable, fail gracefully and never fabricate an AI response.

## Validation and trust boundary

Treat all model output as untrusted. Runtime-validate output before accepting or persisting it, using the existing validation approach or the smallest appropriate dependency. Malformed, incomplete, or invalid responses must produce an explicit extraction failure state. Never invent missing values; unknown facts remain absent or null according to the schema.

## Evidence and confidence

Preserve evidence connecting each extracted value to `sourceText`, so users can understand where BhoomiCheck obtained it. Do not treat a value as verified merely because the model returned it. Where feasible, validate that evidence text occurs in `PreparedDocument.sourceText`.

Represent extraction confidence explicitly. It is extraction confidence—not ownership, legal, entitlement, or government-verification confidence. Document the distinction and avoid arbitrary precision that implies scientific certainty.

## Persistence and API

Integrate with the existing SQLite-backed persistence layer; do not replace it or introduce destructive schema changes. Persist enough to reproduce/audit an extraction, including where appropriate document ID, extraction status, structured result, provider/model metadata, timestamp, and failure/error state. Never persist API secrets.

Expose extraction through existing application/API boundaries. A coherent option is `POST /api/cases/:caseId/documents/:documentId/extract` and/or retrieval of an existing extraction. Choose the smallest API consistent with the repository, validate case/document relationships, and return appropriate not-found, validation, and error states.

## Synthetic cases

Preserve synthetic ground truth. `demo-family-001` must continue to contain controlled signals: historical/supporting area `1.20 acre`; survey area `1.02 acre`; genealogy contains `Synthetic Child B 001` while relevant current/survey holder context does not. Extract these facts from prepared documents rather than hard-coding extraction results. Do not implement discrepancy reasoning.

Keep `demo-family-002` distinct and substantially consistent; do not modify it merely to make tests easier.

## Deterministic tests

Tests must not call live OpenAI. Provide a provider abstraction/fake/mock and test at minimum: valid structured extraction; evidence/source traceability; malformed output rejection; provider failure; missing API configuration where applicable; unknown case/document; persistence/retrieval; hero-case extraction contract; and control-case isolation. The normal suite must not require `OPENAI_API_KEY`.

## UI

Integrate extraction into the existing Documents journey without redesigning the application. Clearly distinguish source document from AI-extracted fields. Where appropriate show “AI-assisted extraction,” extracted value, confidence, and source evidence. State clearly that output is informational and requires verification. Never use “verified owner,” “ownership confirmed,” “legal owner,” or make legal conclusions. Provide sensible loading, failure, and unavailable states and preserve mobile usability.

## Safety and scope

Use synthetic data only. Do not access `land.bihar.gov.in`, scrape government websites, call undocumented government APIs, test live government systems, introduce real citizen/private land-record data or Aadhaar/PAN/OTP/payment data, imply official Bihar government affiliation, add misleading government branding, or make legal ownership determinations. BhoomiCheck is an independent prototype.

Stop after Phase 4. Do not implement Phase 5, cross-document discrepancy reasoning, ownership inference, legal recommendations, RAG, embeddings, vector databases, autonomous multi-agent reasoning, live government integrations, or production OCR. `PreparedDocument` is the Phase 4 input boundary.

## Documentation

Update relevant documentation to explain `PreparedDocument` → `ExtractionService` → OpenAI provider → validation → evidence-backed extraction → persistence/API. Document what OpenAI does, what deterministic code does, what is mocked, what requires `OPENAI_API_KEY`, failure behavior, and safety boundaries. Add `AI_EXTRACTION.md` if useful.

## Acceptance criteria

1. `PreparedDocument` is the input to the AI extraction layer.
2. OpenAI integration exists behind a provider/service abstraction.
3. Output is runtime validated.
4. Extracted facts retain source evidence.
5. Confidence is represented without implying legal certainty.
6. Extraction results can be persisted/retrieved.
7. The existing document journey exposes extraction clearly.
8. Missing API configuration fails gracefully.
9. Automated tests do not require live OpenAI calls.
10. Existing Phase 1–3 behavior remains intact.
11. `demo-family-001` and `demo-family-002` remain distinct.
12. TypeScript passes.
13. ESLint passes.
14. Vitest passes.
15. Production build passes.
16. No live government integration is introduced.

## Completion report

When finished, stop and report these sections: `PHASE 4 STATUS` (Complete / Blocked / Partial), `IMPLEMENTED`, `OPENAI INTEGRATION`, `EXTRACTION CONTRACT`, `EVIDENCE / CONFIDENCE MODEL`, `API / PERSISTENCE`, `UI CHANGES`, `TEST RESULTS`, `BUILD RESULTS`, `SAFETY CHECK`, `KNOWN LIMITATIONS`, `FILES CHANGED`, and `PHASE 5 READINESS`.

Surface any significant regression or architecture conflict explicitly rather than hiding or bypassing it.
