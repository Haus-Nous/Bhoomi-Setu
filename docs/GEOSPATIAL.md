# Synthetic geospatial foundation

## Implemented in Phase 16

BhoomiCheck persists one clearly fictional GeoJSON `Polygon` for each seeded demo case. `ParcelGeometry` records the case/parcel association, immutable demo identifiers, `EPSG:4326`, source reference, source type, provenance, quality, and timestamps. Only `SYNTHETIC` geometry is populated.

`GeospatialService` accepts only closed, bounded GeoJSON `Polygon` or `MultiPolygon` values under a payload limit. It rejects empty, unclosed, malformed, non-finite, out-of-range, or unsupported geometry. It calculates square metres, hectares, and acres deterministically with Turf and labels every result `CALCULATED_FROM_GEOMETRY`.

`ParcelIntelligenceService` assembles selected-case parcel identity, geometry, calculated area, and contextual historical/survey area values. It does not create a discrepancy status and does not modify `AREA_CONSISTENCY`.

## Phase 17 three-source comparison

Parcel Intelligence separately compares three synthetic area sources: a historical/document record, a survey/Parcha record, and a Turf calculation from persisted synthetic GeoJSON. Values are normalized to acres only for supported finite positive units (`acre`, `acres`, `hectare`, `hectares`, `square metre`, `square metres`, and `m²`). Missing, malformed, non-finite, zero, negative, or unsupported values remain unavailable; BhoomiCheck does not guess.

For each of the three pairs, BhoomiCheck calculates `|A - B| / max(A, B) × 100`, making the percentage deterministic and independent of source order. The explicit `BHOOMICHECK_DEMO_AREA_V1` policy classifies ≤2% as `CONSISTENT`, >2% through ≤5% as `REVIEW`, and >5% as `POTENTIAL_ISSUE`; unavailable inputs are `INSUFFICIENT_EVIDENCE`. These are demo tolerances only, not legal, cadastral, statutory, or government tolerances. These derived comparison results remain separate from Phase 5 `VerificationResult` data and are never ownership conclusions.

## Persistence and isolation

`parcel_geometries` stores portable text GeoJSON in both SQLite and Supabase Postgres. No PostGIS runtime is required. Geometry is resolved by both `case_id` and `parcel_id`; no client-supplied geometry ID is accepted. Seed creation and demo reset are idempotent, and new synthetic cases intentionally have no geometry.

The Phase 16A hero seed (`demo-family-001-geometry`) is versioned through its source reference (`BHOOMICHECK-SYNTHETIC-GEO-001-V2`). At initialization, BhoomiCheck replaces only the exact known Phase 16 polygon JSON for that exact synthetic geometry id, case, parcel, and source type. This safely corrects an existing demo row without changing user-created geometry, the control demo, or any non-matching row. Repeated initialization makes no further change.

Phase 16B applies the same narrow, idempotent correction only to the exact former control seed JSON for `demo-family-002-geometry`. The corrected fictional square is 0.00064 degrees per side and calculates to approximately 1.2514493861 acres. Its identifiers, provenance (`SYNTHETIC`), source reference (`BHOOMICHECK-SYNTHETIC-GEO-002`), and contextual historical/survey areas (both 1.25 acres) are unchanged. This mutation cannot affect the hero seed, arbitrary cases, or user-imported rows.

## Map boundary

`ParcelMap` is a client-side MapLibre visualization using an explicit public, HTTPS, no-key OpenStreetMap raster style. It receives geometry from the case-scoped parcel-intelligence API, places the GeoJSON source and synthetic fill/outline in the initial style, synchronizes that source after the style is ready, and fits the viewport to the submitted geometry. A pointer-transparent SVG overlay is projected from the same GeoJSON after map movement and resize so the synthetic boundary remains legible over an empty-ocean basemap. Navigation controls and attribution remain enabled. MapLibre can abort transient raster requests while `fitBounds` changes zoom; those aborts are not treated as an outage. Only a non-aborted error from the explicit OpenStreetMap raster source shows the contextual-background warning. If background tiles genuinely fail, the parcel overlay and textual intelligence remain available; a total MapLibre initialization failure shows a safe textual fallback. Geometry calculation is independent of the basemap. A future `BasemapProvider` may change visualization, while a future `ImageryProvider` may add context; neither changes geometry or its deterministic calculation.

## Future integration boundary

Only this path exists today:

```text
SyntheticParcelGeometryProvider → normalized ParcelGeometry
```

A future authorized path may be designed as:

```text
GovernmentAdapter → CadastralParcelProvider → normalized ParcelGeometry
```

No government provider, BhuNaksha data, real cadastral geometry, satellite analysis, ownership inference, possession conclusion, or encroachment determination is implemented.

## Citizen safety wording

The interface calls this a mapped parcel, synthetic parcel boundary, and geometry estimate. It is not an official cadastral boundary, legal truth, proof of ownership, proof of possession, or proof of encroachment.
