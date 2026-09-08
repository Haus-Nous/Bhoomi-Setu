# Screenshot Plan

## Capture rules

- Run the local demo with synthetic data only.
- Capture the application viewport only: no browser chrome, coding-agent UI, localhost dev overlays, personal tabs, console output, or credentials.
- Use English for the primary set; one Hindi capture is optional if the submission form supports additional images.
- Prefer a 1440px desktop viewport for the main set. A 390px mobile capture is useful only if mobile-first design is a judging criterion.
- Do not add heavy annotations. If needed, add only a small factual label such as “Three deterministic area sources” or “Synthetic context only.”

## Recommended set

| File name | Route | Viewport | What to frame | Caption / proof point |
| --- | --- | ---: | --- | --- |
| `01-landing-hero.png` | `/` | 1440px | Hero, synthetic notice, compact DEMO-128/456 area proof | Evidence-first proposition and safe synthetic framing |
| `02-hero-dashboard.png` | `/cases/demo-family-001` | 1440px | Case state, potential issues, one next action | Unified citizen case view |
| `03-documents-evidence.png` | `/cases/demo-family-001/documents` | 1440px | Core records, imported context, visible safety notice | Evidence hierarchy and traceability |
| `04-verification.png` | `/cases/demo-family-001/verification` | 1440px | Potential issues and source-backed explanation | Deterministic verification, not chatbot judgment |
| `05-parcel-intelligence.png` | `/cases/demo-family-001/parcel-intelligence` | 1440px | Map, 1.20 / 1.02 / 1.0243 values, comparison insight | Three-source parcel comparison |
| `06-earth-observation-context.png` | `/cases/demo-family-001/earth-observation` | 1440px | Synthetic imagery warning and two-date context | Honest provider/context boundary |

## Optional Hindi/mobile proof

At 390px, switch to Hindi and capture either the landing hero or Documents. Confirm that the global synthetic notice, identifiers, proof facts, and primary CTA remain visible and that root horizontal overflow is absent.

## Capture preparation

1. Use `demo-family-001` and, if a previous demonstration changed it, use the visible **Reset demo case** control.
2. For the official-record screenshot, use the prefilled lookup and choose **Search synthetic records**. Do not imply the returned fixture is live.
3. Keep long technical values inside Traceability unless the screenshot is specifically about provenance.
4. Verify the screenshot contains only fictional people, identifiers, documents, geometry, and contextual imagery.

If the submission accepts an additional image, capture the prefilled synthetic lookup at `/cases/demo-family-001/official-records` as an optional provider-boundary screenshot; it does not replace the six-image set above.
