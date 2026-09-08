# Synthetic Earth Observation Context

## Purpose and boundary

Phase 19 adds a local, synthetic contextual-imagery layer. It helps a citizen compare two **synthetic contextual images** attached to a demo case. It is not cadastral or legal evidence, and it never determines a parcel boundary, ownership, possession, encroachment, mutation, construction legality, or an official survey outcome.

## Architecture

`EarthObservationService` first resolves the existing case and parcel, then asks the `ImageryProvider` boundary for immutable fixtures. `SyntheticImageryProvider` is the only current provider. The service deterministically compares fixture metrics and returns a normalized `EarthObservationInsight` through `GET /api/cases/:caseId/earth-observation`.

No imagery metadata, indicator result, or user action is persisted in Phase 19. There are no external imagery calls, AI calls, provider credentials, or map keys.

## Demo fixtures and policy

| Case | Fixture | Deterministic result |
| --- | --- | --- |
| `demo-family-001` | 2023 open/vegetated context and 2025 modest built-up context | vegetation −19 pp and built-up +15 pp: `NOTICEABLE_CHANGE` |
| `demo-family-002` | two visually similar stable-open contexts | vegetation −2 pp and built-up +2 pp: `STABLE` |
| Any known unconfigured synthetic case | no two-date fixture | `INSUFFICIENT_EVIDENCE` |

`BHOOMICHECK_SYNTHETIC_CONTEXT_V1` uses absolute percentage-point movement: ≤4 is `STABLE`; 5–10 is `SMALL_CHANGE`; >10 is `NOTICEABLE_CHANGE`. Missing comparable values produce `INSUFFICIENT_EVIDENCE`; the service does not invent a change.

The visuals are deterministic SVG scene generation in the citizen UI and visibly label themselves as synthetic contextual imagery. Their `synthetic://` asset references identify local fixture data, not a remote image endpoint.

## Deliberate separation

Phase 19 never reads or changes Phase 17's three area sources: `DOCUMENT_RECORD`, `SURVEY_RECORD`, and `GEOMETRY_CALCULATED`. It is not a fourth area source and is absent from pairwise comparison, `comparisonSummary`, and verification truth. Phase 18 imported official-style records remain a separate immutable context artifact.

## Future lawful providers

A future `ImageryProvider` implementation could connect to a lawful provider such as a Sentinel-oriented service, Earth Engine, or another licensed source. That work is not implemented. It would require documented licensing and lawful access, authentication, rate limits, cloud masking, resolution limits, acquisition-date selection, geospatial alignment, provider attribution, privacy and safety review, auditability, and a renewed product/legal boundary review. BhoomiCheck does not currently integrate Google Earth Engine or any Google imagery.
