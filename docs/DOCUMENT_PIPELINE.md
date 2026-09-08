# Document pipeline

Only approved bundled synthetic fixtures can enter the prototype. A fixture attaches to one selected case, persists as a synthetic `DocumentItem`, and can be retrieved as a canonical `PreparedDocument` containing case/document IDs, type, source text, metadata, and `synthetic: true`.

```text
synthetic fixture → persisted document → PreparedDocument
  → optional provider candidate → strict schema validation
  → exact quote/span validation → semantic grounding validation
  → persisted completed extraction OR safe failed attempt
```

## Candidate facts versus accepted facts

An optional configured Gemini or OpenAI provider produces candidate structured facts, never legal truth. `AI_EXTRACTION_PROVIDER` explicitly selects `gemini` or `openai`; there is no automatic key-based fallback. Gemini is recommended for the current demo. The extraction schema requires a value, confidence, uncertainty, and evidence quote/span. Runtime validation verifies that the quote exactly occupies the stated source range and that the value is deterministically supported by that quote.

Supported grounding covers document type, identifiers, person/holder names, relationships, strict acre values/units, location, survey references, and dates where the label/value is present in evidence. Safe normalization allows equivalent formatting such as numeric area precision or punctuation/case in names. Unsupported or inconsistent values fail the entire extraction attempt; they are not silently corrected or persisted as accepted facts.

Each attempt stores provider/model, prompt version, timestamp, status, and safe failure metadata. `GEMINI_API_KEY` and `OPENAI_API_KEY` are server-side only; only the selected provider’s key is required. Provider/configuration/grounding failures never fabricate fields or expose raw provider internals to citizens.

Verification consumes persisted synthetic document content through deterministic rules. It does not ask an LLM to decide a discrepancy and does not promote candidate extraction into a legal conclusion.
