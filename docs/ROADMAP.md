# BhoomiCheck Implementation Roadmap

## Delivery approach

Build a single compelling vertical slice before extending document types, rules, or infrastructure. Each phase has a demonstrable outcome and should preserve the safety constraints in `docs/SAFETY.md`.

| Phase | Scope and deliverables | Complexity | Exit criteria |
| --- | --- | --- | --- |
| 0. Foundation and guardrails | Initialize typed Next.js project, lint/format/test tooling, environment validation, demo-session boundary, persistent notices, Docker/Postgres setup, README | Medium | App boots locally; safety notice is persistent; CI runs lint/typecheck/test |
| 1. Synthetic domain and case intake | Prisma schema/migrations, seed one golden case, case/family/parcel/timeline forms, provenance-ready domain types | Medium | A user can create/edit a synthetic case and see its timeline |
| 2. Synthetic document workflow | Bundled fixture library, document metadata/storage adapter, document viewer, text parsing/OCR adapter, extraction job state | High | Completed: a fixture-only document can be attached, deterministically processed, inspected with source text, and shown with extraction status |
| 3. AI extraction and human review | Structured LLM adapter, per-document schemas/prompts, Zod validation, evidence citations, field review/correction UI, deterministic fallback | High | Suggested fields can be confirmed and become reviewed facts with provenance |
| 4. Unified record and comparison | Unified case read model, normalizers, rule registry, comparison runs, findings UI, versioned audit trail | High | At least three reproducible potential inconsistencies are visible with evidence |
| 5. Explanation and administrative guidance | Grounded explanation generator/template fallback, bilingual-friendly copy, curated stage/finding guidance cards and disclaimers | Medium | Findings are understandable and clearly non-legal/non-binding |
| 6. Survey record and mock packet | Synthetic Khanapuri Parcha display, comparison view, packet composition, watermarking, download/print, export tests | High | Packet is traceable, clearly mock, and contains selected evidence/findings |
| 7. Demo polish and release rehearsal | Playwright golden-path test, responsive/accessibility pass, loading/error states, seeded reset, deck/demo script, deployment | Medium | A fresh demo workspace completes the full journey reliably in under five minutes |

## Recommended order and scope control

1. Complete phases 0–1 before selecting any AI provider.
2. Implement phase 2 against static fixtures; no browser scraping or external record lookup is ever a fallback.
3. Deliver phase 3 initially for only two document kinds: a legacy record and a synthetic survey/Khanapuri record.
4. Limit phase 4 to four or five rules: normalized Khata/Khesra mismatch, area tolerance mismatch, name-variant warning, missing stated relationship, and document-date conflict.
5. Treat phase 6 as the demo climax. Defer maps, multilingual free-form AI chat, multi-user collaboration, and advanced lineage graphing until the vertical slice is stable.

## Scope risks

| Risk | Decision to keep the MVP credible |
| --- | --- |
| Trying to support every Bihar document/process | Support a small labelled fixture set and disclose coverage |
| Building autonomous legal reasoning | Restrict AI to extraction/explanation and deterministic rule outputs |
| Building a map/GIS subsystem | Show a static synthetic map attachment/reference only |
| Deep Hindi language quality work | Use controlled bilingual labels and reviewed copy; do not promise broad translation |
| Production identity, security, and operations | Use demo sessions and synthetic-only data; leave a documented upgrade path |
| Too many findings | Prioritize a short actionable list with evidence and a review state |

## Credible hackathon-demo definition of done

The demo is ready when it can reliably demonstrate one seeded synthetic case end to end, survive an AI-provider outage through stubs/templates, explain at least three source-backed potential inconsistencies, render a synthetic survey comparison, and export a watermark-protected mock packet. It must make the prototype and non-legal boundaries impossible to miss.

## Suggested work breakdown

| Workstream | First implementation target |
| --- | --- |
| UX | Case dashboard, document review, finding detail, survey comparison, packet preview |
| Domain | Case, person, relationship, parcel, identifier, reviewed fact, finding |
| AI | One schema per two fixture types; extraction and explanation adapters |
| Rules | Pure functions with fixtures and tests before UI integration |
| Export | Single HTML/print/PDF template with page-level watermark |
| Quality | One full Playwright journey and unit tests for every comparison rule |
