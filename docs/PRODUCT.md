# BhoomiCheck Product Definition

## Purpose

**BhoomiCheck** is an independent citizen-side assistance and verification prototype for the AI-Rebuilder 2026 hackathon.

**Tagline:** *Understand your land record before you act.*

It helps a citizen understand a **synthetic** land-survey case, organise supplied demo records, identify deterministic record differences, and prepare a local **MOCK** review packet. It is not a Government of Bihar service, an official records portal, or a legal decision-maker.

## Current prototype journey

1. Create a local synthetic case with district, circle, village, Khata, optional Khesra, and nickname.
2. Attach only bundled synthetic document fixtures.
3. Inspect source text and run optional structured extraction.
4. Review a unified case dashboard, family context, parcel summary, and synthetic survey record.
5. Run deterministic verification and inspect source-backed findings.
6. Read a single preparation-oriented next action.
7. Prepare and locally save a MOCK review packet; a packet marked ready for review is read-only and is never submitted anywhere.
8. Follow the timeline, which shows only events that have occurred for that persisted case.
9. View optional synthetic parcel intelligence: a mapped boundary, calculated geometry area, and contextual existing record areas.
10. Look up synthetic official-style fixtures by case identifiers, inspect a selected result, verify its deterministic identity context, and link it to the BhoomiCheck case.
11. Review a linked official-style record as separate context on the Dashboard, Documents, and Parcel Intelligence screens.

The seeded hero case (`demo-family-001`) demonstrates an area mismatch and a family-context mismatch. The seeded control (`demo-family-002`) does not demonstrate either hero discrepancy. A newly created case begins without documents, extraction, verification, guidance, or packet data and shows explanatory empty states.

## What the product currently checks

Verification is deterministic. The implemented rules compare:

- area values when both source-backed values are present and parseable; and
- the labelled family member under review with the labelled recorded holder when both source-backed values are present.

If a required fact is absent, malformed, or not comparable, the outcome is `INSUFFICIENT_EVIDENCE`, not an invented discrepancy. A potential issue means the available synthetic records differ; it does not establish ownership, inheritance, title, fraud, record correctness, or legal eligibility.

Geometry is a separate contextual layer. It is calculated from a synthetic map boundary and does not alter `AREA_CONSISTENCY`, determine ownership, or establish an official parcel boundary.

## Synthetic official-record context

The Phase 18 journey is:

```text
Case → official-record lookup → search synthetic official-style fixtures
→ inspect result → verify deterministic identity context
→ import into BhoomiCheck case → view case context
```

This demonstrates how BhoomiCheck could eventually consume a lawful official-record provider without connecting the hackathon prototype to government infrastructure today. Every current result is a deterministic synthetic fixture, is not legal evidence, is not authoritative, and cannot be submitted anywhere or change ownership.

An imported synthetic official-style record is a case-context artifact rather than a citizen-uploaded document. It does not replace existing documents, feed extraction, or change verification truth. Phase 17 also remains exactly a three-source comparison—historical/document record, Survey/Parcha record, and mapped geometry. The imported record is context only, not a fourth source.

## AI and extraction boundary

Document extraction is optional and server-side. When explicitly configured, a Gemini or OpenAI provider may propose structured candidate facts. The application accepts a candidate only after schema, source-span, and semantic-grounding checks; otherwise it stores no accepted fact. Demo fixtures use controlled synthetic extraction behaviour. An LLM never determines verification status, legal ownership, or the next legal outcome.

## Language behaviour

English and Hindi are presentation locales from one controlled copy structure. Switching language changes interface copy and rule/packet presentation templates only. It does not change persisted identifiers, source evidence, citizen notes, verification results, packet status, or other case facts.

## Boundaries and non-goals

- No live government integration, government URLs, scraping, reverse engineering, credentials, OTP, payments, or submission.
- No arbitrary or real-document upload: only bundled synthetic fixtures can be attached.
- No Aadhaar, PAN, banking, or real private land-record data.
- No legal ownership, title, inheritance, or filing determination.
- No downloadable, printable, or official-looking packet export in the current prototype.
- No authentication, session isolation, tenancy, production retention policy, or shared real-data deployment controls. A hosted synthetic demo can use the documented server-side Postgres adapter, but it is not a multi-user citizen-data system.

## Demo success criteria

A credible demo shows a persisted synthetic case, evidence-backed deterministic findings, clear Hindi/English explanations, one next preparation action, and a locally persisted MOCK packet. All consequential screens retain the independent-prototype, synthetic-data, and non-legal boundary.

## Earth observation context

The Parcel Intelligence route can lead to a dedicated two-date synthetic context view. It uses plain language such as possible vegetation or built-up context change, but repeatedly states that imagery is neither cadastral nor legal evidence. It must never describe an indicator as encroachment, ownership, boundary movement, construction legality, or a government-confirmed result.

## Synthetic evaluation

The repository includes a 12-case synthetic benchmark. Its reported values measure only those fixtures and deterministic checks. They are not claims about real land records, legal accuracy, model quality in the field, or production performance.
# Parcel Intelligence

The Parcel Intelligence view explains a synthetic document record, synthetic Survey/Parcha record, and mapped synthetic geometry together. It presents transparent, source-traceable deterministic comparisons and cautious wording. It does not decide which record is correct, establish ownership, or represent a government or cadastral determination.
