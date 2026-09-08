# BhoomiCheck Evaluation

## Purpose

This is a small, reproducible prototype evaluation. It measures deterministic fixture behavior, structured extraction scoring helpers, safety checks, and robustness boundaries. It is not a real-world, legal, or production-accuracy benchmark.

## Evaluation dataset

The deterministic CI dataset contains 12 fully synthetic cases: clean records, area-only and family-only issues, the combined hero scenario, four insufficient-evidence variants, formatting/punctuation variants, and the control scenario. No live OpenAI or government service is required.

## Ground truth

Each fixture explicitly declares input records and expected `AREA_CONSISTENCY` and `FAMILY_CONTEXT` outcomes plus relevant important facts. Ground truth is declared independently of the evaluated outcome. The runner constructs synthetic `DocumentItem` inputs and invokes the production `VerificationService`; it does not duplicate the rule algorithm in evaluation code.

## Extraction metrics

`scoreExpectedFacts` is a deterministic extraction-contract scoring helper: it reports expected facts, matched facts, missing facts, false extractions, and evidence presence. It is not a live Gemini or OpenAI extraction-accuracy benchmark. Runtime extraction tests separately validate semantic evidence grounding, malformed output rejection, provider failure, missing configuration, prompt-version retention, and metric outcomes. No live model call runs in CI.

## Verification metrics

The runner evaluates 24 production-rule checks (12 fixtures × 2 rules), including 1.20 vs 1.200 normalization and insufficient evidence. It calculates correctness, incorrect outcomes, false positives, false negatives, expected/actual insufficient-evidence counts, insufficient-evidence classification errors, and per-rule outcome distributions from declared ground truth versus actual `VerificationService` output. A false positive is an actual `POTENTIAL_ISSUE` where ground truth is not a potential issue; a false negative is an expected potential issue that is not returned as one.

## Grounding/safety checks

The evaluation rejects prohibited claim phrases in citizen-facing template checks and tests that source values, rule outcomes, packet links, and cross-case references stay within existing deterministic boundaries. These checks do not claim to evaluate all natural-language risks.

## Robustness scenarios

Existing and evaluation tests cover malformed model output, unsupported facts, provider failure, explicit Gemini/OpenAI selection and missing selected-provider configuration, invalid case IDs, cross-case packet source, invalid packet body, insufficient evidence, and unsupported packet state transitions.

## Observability

`src/server/metrics.ts` provides a process-local, privacy-minimized event sink. Events contain only operation, success/failure, duration, and small metadata such as synthetic case/document IDs. Instrumentation failures are swallowed so they cannot interrupt a citizen workflow. This is not deployed monitoring infrastructure.

## Actual measured results

Command: `npm run eval`

- Dataset: 12 synthetic cases
- Verification: 24/24 expected rule outcomes (100.0%)
- Incorrect outcomes: 0
- False positives: 0
- False negatives: 0
- Expected / actual insufficient-evidence outcomes: 5 / 5
- Insufficient-evidence classification errors: 0
- Hero fixture: `AREA_CONSISTENCY = POTENTIAL_ISSUE`; `FAMILY_CONTEXT = POTENTIAL_ISSUE`
- Control fixture: `AREA_CONSISTENCY = PASS`; `FAMILY_CONTEXT = INSUFFICIENT_EVIDENCE`

These numbers are emitted by the deterministic runner using the production verification service and verified by evaluation tests, including a deliberately wrong outcome that lowers accuracy and changes confusion counts. They describe this fixture set only.

## What these results do not mean

They do not establish production accuracy, performance on real land records, legal correctness, generalization to varied documents, or reliability of an optional live model. Optional live-model evaluation is not executed or reported by CI.

## Limitations

The benchmark is small, synthetic, and rules-focused. It does not include real documents, real citizens, official processes, production observability, or live-model results.
