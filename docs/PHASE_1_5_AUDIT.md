# Phase 1.5 Audit

## Executive summary

**READY AFTER P0 FIXES**

> Remediation update (2026-08-24): P0 route identity and complete case-detail data flow are resolved. Case routes now live at `/cases/[caseId]`, call `CaseService.getCase(caseId)`, render ID-specific `CaseDetail` data, and show a not-found state for unknown IDs. Family, parcel, survey, verification, guidance, and timeline data now originate in `MockCaseRepository`; the document selector is a native button. Validation after remediation: TypeScript, ESLint, Vitest (4 tests), and production build pass.

Phase 1 has a strong visual shell: all requested routes exist, the mock journey is clickable during a single client session, the design is restrained and independent in tone, and the production build, TypeScript, and ESLint checks pass. The project is not yet structurally ready to connect the Phase 2 API because the route identity, provider state, mock service, and several screen data sources disagree.

The P0 work is deliberately small: make the route `caseId` the source of truth, evolve the service contract to retrieve a case by ID, and make case-derived screens render supplied case data rather than duplicated demo constants. No database, backend, AI feature, or redesign is required to resolve it.

Scope inspected: root project instructions (no project-level `AGENTS.md` exists), all Phase 1 source files, package/configuration files, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/SAFETY.md`, and `.21st/design.json`.

## Architecture findings

### Confirmed separation

- UI routes depend on `CaseProvider`; they do not import the `demoCase` object or JSON fixtures directly.
- `CaseProvider` depends on the `CaseService` interface, and `MockCaseService` is the only current mock-data owner. This is the right initial direction.
- Domain presentation components are consolidated in `src/components/domain.tsx`; no circular imports were found. The dependency flow is currently `routes → CaseProvider → case-service → types`, with shell/domain components depending on types only.

### Findings

| Priority | Finding | Evidence and impact |
| --- | --- | --- |
| P0 | Route identity is ignored. | Every page beneath `src/app/case/[caseId]/` reads the one global `landCase` from `CaseProvider`; none reads or passes the route parameter. Refreshing `/case/<new-id>` loads the seeded demo via `getDemoCase()`, and opening any arbitrary ID presents the same case. This blocks a future `GET /cases/:caseId` contract and makes the URL unreliable. |
| P0 | Case-derived content is split between the service and hard-coded screens. | `src/components/domain.tsx:8` hard-codes the survey record; `src/app/case/[caseId]/family/page.tsx:5` hard-codes all people/relationships; `survey-record/page.tsx:6`, `verification/page.tsx:5`, `next-action/page.tsx:6`, and dashboard counters/recommendation in `page.tsx:6` hard-code values or derive only part of the case. A second case therefore has a changed header but still shows the first case's family/survey/action content. |
| P1 | UI composition contains presentation-level domain calculations. | The dashboard filters warnings and slices documents in the route, while `CaseProgress` defaults to fixed `3/5` in `src/components/domain.tsx:4`. These are small now, but the API/read model should provide `progress`, counts, and recommended action rather than having route components calculate them ad hoc. |
| P1 | The provider has no service error state. | `src/components/case-context.tsx:6` calls `getDemoCase()` without `catch`; rejected reads fall through to a misleading empty state. Failed creates leave `pending` true because `create-case/page.tsx:5` has no `try/finally`. `ErrorState` exists but no route renders it. |
| P2 | Route components are compressed into one-line functions. | Most routes are 5–6 very long lines. This is not a runtime issue, but it impedes code review, precise diffs, and accessible-state maintenance. |

There is no direct UI-to-database coupling, no duplicated component implementation, no unsafe type assertion, `any`, debug log, commented-out code, TODO, or circular dependency in the audited application source.

## Domain-model findings

### Current types

| Concept | Current definition | Assessment |
| --- | --- | --- |
| Case | `LandCase` in `src/types/case.ts:5` | A UI aggregate, not a reusable canonical case entity. It embeds formatted area and entire presentation collections. |
| Document | `DocumentItem` in `src/types/case.ts:3` | UI-oriented: `added` is display text and `fields` lacks source/review status. |
| Verification issue | `VerificationItem` in `src/types/case.ts:4` | Useful starting shape but string statuses/severity and string evidence are insufficient for provenance. |
| Timeline | `TimelineEvent` in `src/types/case.ts:2` | UI-oriented: `date` is display text (`Step 1`, `Next`) rather than a timestamp/event type. |
| Person | Not typed | Rendered as hard-coded props in `family/page.tsx:5`. |
| Family relationship | Not typed | Rendered as hard-coded arrow/labels in `family/page.tsx:5`. |
| Land parcel | Not typed | Flattened into `LandCase` fields (`khata`, `khesra`, `area`). |
| Survey record | Not typed | Hard-coded in `SurveyRecordCard`. |
| Action/guidance | Not typed | Local option objects in `next-action/page.tsx:6`. |

No type is duplicated verbatim, but the same conceptual values are duplicated across `demoCase` and route/component literals. Naming is mostly consistent (`LandCase`, `DocumentItem`, `VerificationItem`), but the `Item` suffix signals presentation data rather than durable domain concepts. `Status` is also too generic and overlaps semantically with timeline, document, review, and verification states.

### Canonical model recommendation (do not implement in this phase)

Define API-safe domain entities independently from UI display text:

- `Case` — `id`, `nickname`, `location`, `surveyStage`, `createdAt`, `status`.
- `Parcel` and `ParcelIdentifier` — raw identifier values plus display/normalized values and typed area `{ value, unit }`.
- `Person` and `FamilyRelationship` — IDs, relationship enum, assertion/review state, source reference.
- `Document`, `ExtractedField`, and `EvidenceReference` — document kind, processing state, ISO dates, page/span citations, extraction/review state.
- `SurveyRecord` and `SurveyRecordEntry` — distinct source-side facts, not a card-specific structure.
- `VerificationFinding` — rule code, severity, confidence, evidence references, explanation, reviewed state.
- `GuidanceAction` — action code, title/body translation keys, availability, disclaimer, and optional linked finding.
- `TimelineEvent` — event code, ISO timestamp, translation key/parameters, and source reference.

Then expose a dedicated `CaseDetailView` DTO for the dashboard. It may contain display-ready summaries and counts, but it must be constructed by the service/API layer and reference canonical entities. Keep UI-only types next to their components only when they cannot be reused by API contracts.

## Service-layer findings

`src/services/case-service.ts` succeeds as a minimal seam but cannot evolve into the documented application API without a contract adjustment.

### What works

- `CaseService` is an explicit interface.
- `createCase(input)` returns a typed `Promise<LandCase>` and the provider does not know whether the implementation is mock or remote.
- `CreateCaseInput` is derived from the case type, which prevents form fields drifting immediately.

### What is insufficient

| Priority | Minimum required change before API work | Reason |
| --- | --- | --- |
| P0 | Replace `getDemoCase()` with `getCase(caseId)`; add an intentional `getInitialCase()`/demo-selection method only if needed. | The API contract needs resource identity. A permanently named demo getter cannot load URLs or errors correctly. |
| P0 | Have the provider load/reload by route ID and expose `{ case, status, error, refresh }`. | It aligns client state with the URL and allows useful loading/error states without changing every route again. |
| P0 | Move all demo facts into a fixture module behind `MockCaseService`, and return one complete `CaseDetailView`. | This removes the parallel demo sources in screen components. |
| P1 | Split write contracts from read DTOs (`CreateCaseInput`, `CaseDetailView`, `DocumentDetailView`). | `LandCase` is currently both persistence model and dashboard view. |
| P1 | Add typed domain/service failures or result handling. | UI must distinguish not found, network failure, invalid input, and empty state. |

The intended future flow should be `route/UI → CaseProvider/query adapter → CaseService → HTTP API → database`. The service should remain a client-facing interface; it must not import database code or Prisma types.

## UX findings

### Primary journey

| Transition | Result | Finding |
| --- | --- | --- |
| Landing → Create Case | Works. Primary CTA is clear; secondary CTA correctly stays on the landing page. | No blocker. |
| Create Case → Dashboard | Works in the live React session. Required fields have a general validation message. | P0 state/route mismatch after refresh; P1 failed-create state is not handled. |
| Dashboard → Documents / Family / Verification / Survey / Next Action / Timeline | All navigation links exist and case navigation offers a back path. | P0: the destination can display demo constants unrelated to the newly created case. |
| Documents → extracted fields | Works visually through local selected state. | P1 accessibility interaction defect; no field review action yet is appropriate for Phase 1. |
| Family / Verification / Survey → Next Action | The intended next choice is clear. | P0 static family/survey/check content; no dead-end navigation. |
| Next Action → Timeline | The sidebar allows the transition. Selecting a card only changes the card state; it does not persist a selection. | P2 until guidance persistence is introduced. |

The dashboard empty state is present only for a provider state that cannot normally happen because the provider always loads the seeded case. Most non-dashboard routes collapse `loading` and missing data into the same loading view; they do not provide a useful empty state. Error UI is never reachable.

## Accessibility findings

### Strengths

- The layout uses a real `<header>`, labelled `<nav>` elements, `<main id="main">` on rendered page states, a footer, and a skip link.
- Form controls are nested within visible labels; required fields are identified and the validation message uses `role="alert"`.
- Keyboard focus styles are visible, interactive cards are generally links/buttons, no images require alternative text, and headings follow a sensible page-level hierarchy.

### Findings

| Priority | Finding | Evidence |
| --- | --- | --- |
| P1 | Document selection is a non-semantic clickable `div`. | `src/app/case/[caseId]/documents/page.tsx:6` uses `role="button"`, `tabIndex`, and only an Enter handler. Space does not activate it; the 21st deterministic review reports `a11y-interactive-div`. Use a native button or link with one interactive target. |
| P1 | Loading/empty states on six case subroutes are returned without a `main` landmark. | `documents`, `family`, `verification`, `survey-record`, `next-action`, and `timeline` return `LoadingState` directly. While loading, the skip link has no `#main` target. |
| P1 | Selection buttons do not expose their state. | `next-action/page.tsx:6` visually changes the selected action but lacks `aria-pressed`/radio semantics and no text confirms the selected item. |
| P2 | Progress is not represented as a progressbar. | `CaseProgress` has a textual `aria-label` on a section and a visual `<i>` track, but no `role="progressbar"`, `aria-valuenow`, or accessible denominator. |
| P2 | Form errors are only aggregate. | The form alert is announced but fields lack `aria-invalid` and `aria-describedby`; users cannot identify which input is missing without visual scanning. |
| P2 | Reduced motion is not respected. | The loading spinner animation lacks a `prefers-reduced-motion` override. |

## Mobile findings

The CSS has a meaningful 760px breakpoint. At 360px, 390px, and 430px, dashboard grids, family cards, compare rows, fields, and action cards reduce to one column; no fixed-width table or modal exists. The landing hero also becomes one column. At 768px, the desktop case layout leaves about 486px for content after the 196px sidebar and 46px gap, which is tight but not structurally overflowing. At 1280px and 1440px the max-width container and three-card grid are appropriate.

| Priority | Finding | Evidence |
| --- | --- | --- |
| P1 | Case navigation deliberately scrolls horizontally on small screens, but its touch targets are below the recommended 44px size. | At `max-width:760px`, `.case-nav` becomes a single-row scroller; `.case-nav a` has approximately 32px visual height from 9px vertical padding and 0.9rem text. The header's `.button.small` is 36px tall as well. |
| P2 | The 768px layout is visually dense. | The sidebar remains vertical until 760px, producing a narrow reading column on small tablets. Consider changing the breakpoint only after checking a rendered device view; this is a risk, not a proven overflow. |
| P2 | No explicit `overflow-wrap` protection covers unpredictable future values. | Current short synthetic values fit; long village names, document titles, source evidence, or translated Hindi strings may overflow or force awkward horizontal scrolling. |

No modal, table, desktop-only hover control, or obvious fixed-width overflow was found in source. A browser/device visual pass is still required before release; this audit verified responsive rules in code, not screenshots at every viewport.

## Localization findings

`src/lib/i18n.ts` establishes English and Hindi objects with equivalent keys today, and navigation/notice/CTA text uses it. It does not yet establish a real localization boundary.

| Priority | Finding | Evidence |
| --- | --- | --- |
| P1 | Most user-visible text is embedded directly in route and component JSX. | Every screen contains English copy; examples include all domain components in `src/components/domain.tsx:3-13`, `CaseHeader` in `shell.tsx:10`, and the landing, create, dashboard, family, survey, and next-action pages. This conflicts with the localization requirement and makes Hindi support a rewrite. |
| P1 | Missing translations cannot be detected. | `copy` is inferred with `as const`; Hindi happens to match English today, but no English-derived `TranslationShape`, `satisfies`, build-time key check, or test enforces that future locales include every key. |
| P1 | There is no selected locale or formatting layer. | `t()` always defaults to English; `<html lang="en">` is static. Dates, numbers, areas, stages, relationship labels, and domain explanations have no translation keys or locale formatting strategy. |
| P2 | Domain terminology is only raw strings. | Khata, Khesra, Khanapuri Parcha, stages, and statuses need stable term keys plus plain-language explanation keys; hard-coded text cannot support consistent bilingual explanations. |

## Safety findings

The visible product largely observes the synthetic government boundary:

- A persistent header notice, landing-page limitation, form notice, survey label, and next-action notice state that this is synthetic, independent, and non-legal.
- No government logo, government URL, crawler/client, submission route, OTP/payment field, Aadhaar/PAN field, or private document fixture is present.
- `Ram Prasad`, `Suresh Prasad`, `Asha Prasad`, and `Ravi Prasad` are explicitly synthetic/generic in context. No real personal identifier is present.

| Priority | Finding | Evidence |
| --- | --- | --- |
| P1 | The mock location uses real place names despite `docs/SAFETY.md:20` requiring unmistakably synthetic seed data, including fictional villages. | `case-service.ts:7` uses Nalanda and Bihar Sharif; form placeholders repeat them. They are not private personal data, but replacing all seeded location labels with clearly fictional `DEMO-` values would make the boundary unambiguous. |
| P2 | “Survey record ready to review” can read like a live official status when detached from the persistent notice. | It is currently mitigated by the layout notice and synthetic record label. Use an internal/demo stage label in future structured data. |

## Test status

**PASS, but inadequate for Phase 2.**

Test infrastructure inspection found no `vitest.config.*`, setup file, browser environment, Testing Library, Playwright configuration, MSW, integration suite, or E2E suite. `package.json` executes Vitest's default discovery. The sole file, `src/lib/normalizers.test.ts`, contains one assertion that a literal `"demo-2026-014"` begins with `demo-`; it does not import or test production code.

The previous `ENOSPC` was environmental: Vitest attempted to create a directory under the macOS temporary location. It is not evidence that tests were correct or incorrect. On this audit run disk space became available and `./node_modules/.bin/vitest run` passed: **1 test file, 1 test**. No test-suite configuration change is required merely to run it once space exists, but meaningful Phase 2 work requires test configuration and real unit/integration/UI coverage.

## Build status

**PASS.**

- `./node_modules/.bin/tsc --noEmit` — passed.
- `./node_modules/.bin/eslint .` — passed.
- `./node_modules/.bin/next build` — passed; all listed routes compiled and static/dynamic generation completed.
- `21st review src --json` — one error: non-semantic interactive document row, recorded above; one informational design-token warning for CSS color literals.

The production build normalized `tsconfig.json` with Next.js-required settings (`jsx: react-jsx`, `esModuleInterop`, `resolveJsonModule`, `isolatedModules`) and suggested `allowJs`/additional Next dev types. These are build-tool changes, not an application failure; review and retain the intentional configuration rather than allowing generated configuration to drift unnoticed.

## P0 issues

1. **Route/resource identity is not honored.** `src/components/case-context.tsx`, `src/components/shell.tsx`, and every `src/app/case/[caseId]/**/page.tsx` must load/render the case identified by `[caseId]`, rather than a global demo case.
2. **The service/read-model boundary is incomplete.** `src/services/case-service.ts` needs ID-based read semantics and one complete mock case-detail DTO; hard-coded family, survey, verification, and guidance data in routes/components must become input data before API integration.

## P1 issues

1. Fix the semantic document-row activation and expose selected next-action state: `src/app/case/[caseId]/documents/page.tsx`, `src/app/case/[caseId]/next-action/page.tsx`.
2. Add real loading, empty, and error-state contracts/landmarks: `src/components/case-context.tsx`, `src/components/domain.tsx`, and all case subroute pages.
3. Establish canonical domain entities/DTOs before adding API/database code: `src/types/case.ts`, `src/services/case-service.ts`, `src/components/domain.tsx`, and the hard-coded case screens.
4. Move user-facing copy and terminology to a typed, complete locale system: `src/lib/i18n.ts`, all `src/app/**/*.tsx`, `src/components/domain.tsx`, `src/components/shell.tsx`.
5. Make mock locations unambiguously fictitious: `src/services/case-service.ts`, `src/app/create-case/page.tsx`.
6. Improve mobile touch target sizes: `src/app/globals.css`.
7. Make the test suite meaningful before behavior grows: `src/lib/normalizers.test.ts`, plus new test configuration and Phase 2-relevant tests.

## P2 issues

1. Replace fixed dashboard progress/counts and local action selection with read-model data when the underlying behavior is available.
2. Add progressbar semantics, field-level form error associations, and reduced-motion support.
3. Add resilient wrapping/visual checks for long translated values; inspect the 768px layout with a browser.
4. Move development-only type packages to `devDependencies`; assess removal of direct unused `@eslint/eslintrc` from `package.json`. Keep Next, React, React DOM, ESLint, eslint-config-next, TypeScript, and Vitest: each is currently needed by the runtime/build/lint/test scripts.
5. Use readable multi-line component formatting to improve maintainability. The color-literal review item is not design drift today because `globals.css` defines CSS custom properties, but those tokens should eventually be documented/consumed consistently.

## Recommended fixes

1. Define the canonical domain/DTO boundary on paper or in types only: `Case`, `Parcel`, `Person`, `FamilyRelationship`, `Document`, `SurveyRecord`, `VerificationFinding`, `GuidanceAction`, and `TimelineEvent`.
2. Change `CaseService` to `getCase(caseId)` and a complete `CaseDetailView`; make the provider route-aware and error-aware. Keep `MockCaseService` as the fixture-backed implementation.
3. Pass family/survey/guidance/finding data into their existing reusable cards instead of storing facts inside components or pages.
4. Centralize UI copy behind a typed English source locale and enforce complete Hindi keys; add a selected locale provider only after keys are centralized.
5. Address the P1 semantic/mobile/error-state issues, then add tests for ID-based service loading, creation failure, document selection keyboard operation, and the golden journey.
6. Re-run typecheck, ESLint, Vitest, production build, and `21st review` after those fixes. Do not begin database implementation until the P0 state/API seam is in place.

## Phase 2 readiness

**READY AFTER P0 FIXES**

Strong: complete navigation shell, reusable cards, service seam, clear synthetic/non-legal positioning, passing build/type/lint checks, and no live-government coupling.

Weak: resource identity is not preserved, the service is demo-specific, several screen facts are hard-coded outside mock data, localization is only partial, and coverage is not substantive.

Phase 2 may start only after the two P0 items are corrected. Exact code files requiring change are `src/services/case-service.ts`, `src/components/case-context.tsx`, `src/components/shell.tsx`, `src/types/case.ts`, `src/components/domain.tsx`, and every case route that presently embeds case facts: `src/app/case/[caseId]/page.tsx`, `documents/page.tsx`, `family/page.tsx`, `verification/page.tsx`, `survey-record/page.tsx`, `next-action/page.tsx`, and `timeline/page.tsx`. P1 follow-up also requires `src/lib/i18n.ts`, `src/app/create-case/page.tsx`, `src/app/globals.css`, `src/lib/normalizers.test.ts`, and `package.json`.
