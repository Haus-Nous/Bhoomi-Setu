# Verification engine

`VerificationService` makes every discrepancy decision deterministically. It reads selected case-scoped synthetic documents, records a replaceable verification snapshot, and retains source-document IDs and compared values for each result. No LLM decides whether a discrepancy exists.

## Outcomes

- `PASS` — the supported comparable values match.
- `POTENTIAL_ISSUE` — supported comparable values differ; this is informational, not an ownership or correctness decision.
- `INSUFFICIENT_EVIDENCE` — a required document, explicit comparison subject, holder, or supported value is unavailable or unusable.

## AREA_CONSISTENCY

The rule requires exactly one labelled finite value in each historical and survey record:

```text
Area: <number> acre|acres
```

It compares normalized numeric values, so `1.20 acre` and `1.200 acre` pass. Malformed, non-finite, missing, duplicate, or unsupported-unit values—including `1.2.0 acre`—produce `INSUFFICIENT_EVIDENCE`, never a fabricated mismatch.

## FAMILY_CONTEXT

The rule requires one explicit synthetic genealogy input:

```text
Family member under review: <name>
```

and one survey input:

```text
Recorded holder: <name>
```

It normalizes case, whitespace, and punctuation for exact synthetic-name comparison. It does not use a hero-name pattern, merge ambiguous people, infer heir status, or decide inheritance/ownership. Missing or ambiguous inputs produce `INSUFFICIENT_EVIDENCE`.

Guidance and review packets derive from persisted verification outcomes and preserve their source references. They never submit, correct, or validate a government record.
