import { VerificationService } from "@/server/verification-service";
import type { DocumentItem, DocumentKind, VerificationOutcome } from "@/types/case";

export type BenchmarkCase = {
  id: string;
  historicalArea?: string;
  surveyArea?: string;
  genealogySubject?: string;
  surveyHolder?: string;
  expected: { area: VerificationOutcome; family: VerificationOutcome; importantFacts: string[] };
};

const pass: VerificationOutcome = "PASS";
const issue: VerificationOutcome = "POTENTIAL_ISSUE";
const insufficient: VerificationOutcome = "INSUFFICIENT_EVIDENCE";

export const benchmarkCases: BenchmarkCase[] = [
  { id: "clean-001", historicalArea: "1.20 acre", surveyArea: "1.20 acre", genealogySubject: "Synthetic Child B 001", surveyHolder: "Synthetic Child B 001", expected: { area: pass, family: pass, importantFacts: ["DEMO-101", "1.20 acre"] } },
  { id: "clean-format-002", historicalArea: "1.200 acre", surveyArea: "1.20 acre", genealogySubject: "Synthetic Child B 002", surveyHolder: "synthetic child b 002", expected: { area: pass, family: pass, importantFacts: ["1.200 acre"] } },
  { id: "area-issue-003", historicalArea: "1.20 acre", surveyArea: "1.02 acre", genealogySubject: "Synthetic Child B 003", surveyHolder: "Synthetic Child B 003", expected: { area: issue, family: pass, importantFacts: ["1.20 acre", "1.02 acre"] } },
  { id: "family-issue-004", historicalArea: "1.20 acre", surveyArea: "1.20 acre", genealogySubject: "Synthetic Child B 004", surveyHolder: "Synthetic Child A 004", expected: { area: pass, family: issue, importantFacts: ["Synthetic Child B 004"] } },
  { id: "hero-both-005", historicalArea: "1.20 acre", surveyArea: "1.02 acre", genealogySubject: "Synthetic Child B 001", surveyHolder: "Synthetic Child A 001", expected: { area: issue, family: issue, importantFacts: ["DEMO-128", "DEMO-456", "1.20 acre", "1.02 acre", "Synthetic Child B 001"] } },
  { id: "missing-historical-006", surveyArea: "1.20 acre", genealogySubject: "Synthetic Child B 006", surveyHolder: "Synthetic Child B 006", expected: { area: insufficient, family: pass, importantFacts: [] } },
  { id: "missing-survey-area-007", historicalArea: "1.20 acre", genealogySubject: "Synthetic Child B 007", surveyHolder: "Synthetic Child B 007", expected: { area: insufficient, family: pass, importantFacts: [] } },
  { id: "missing-genealogy-008", historicalArea: "1.20 acre", surveyArea: "1.20 acre", surveyHolder: "Synthetic Child B 008", expected: { area: pass, family: insufficient, importantFacts: [] } },
  { id: "missing-holder-009", historicalArea: "1.20 acre", surveyArea: "1.20 acre", genealogySubject: "Synthetic Child B 009", expected: { area: pass, family: insufficient, importantFacts: [] } },
  { id: "punctuation-010", historicalArea: "1.20 acre", surveyArea: "1.20 acre", genealogySubject: "Synthetic Child B 010", surveyHolder: "Synthetic-Child B.010", expected: { area: pass, family: pass, importantFacts: [] } },
  { id: "area-issue-011", historicalArea: "0.82 acre", surveyArea: "0.80 acre", genealogySubject: "Synthetic Child B 011", surveyHolder: "Synthetic Child B 011", expected: { area: issue, family: pass, importantFacts: [] } },
  { id: "control-012", historicalArea: "1.25 acre", surveyArea: "1.25 acre", expected: { area: pass, family: insufficient, importantFacts: ["DEMO-902", "DEMO-114", "1.25 acre"] } }
];

const document = (id: string, kind: DocumentKind, sourceText: string): DocumentItem => ({ id, title: `Benchmark ${id}`, kind, type: "Synthetic benchmark record", addedLabel: "Synthetic evaluation fixture", state: "extracted", fields: [], sourceText, isSynthetic: true });

export function documentsForBenchmark(item: BenchmarkCase): DocumentItem[] {
  const documents: DocumentItem[] = [];
  if (item.historicalArea !== undefined) documents.push(document(`${item.id}-historical`, "legacy-record", `Area: ${item.historicalArea}`));
  if (item.surveyArea !== undefined || item.surveyHolder !== undefined) documents.push(document(`${item.id}-survey`, "survey-record", `${item.surveyArea !== undefined ? `Area: ${item.surveyArea}\n` : ""}${item.surveyHolder !== undefined ? `Recorded holder: ${item.surveyHolder}` : ""}`.trim()));
  if (item.genealogySubject !== undefined) documents.push(document(`${item.id}-genealogy`, "family-note", `Family member under review: ${item.genealogySubject}`));
  return documents;
}

export function evaluateBenchmarkCase(item: BenchmarkCase) {
  const result = new VerificationService().evaluateDocuments(item.id, documentsForBenchmark(item));
  return {
    area: result.find((value) => value.ruleId === "AREA_CONSISTENCY")?.outcome ?? insufficient,
    family: result.find((value) => value.ruleId === "FAMILY_CONTEXT")?.outcome ?? insufficient
  };
}

export type RuleOutcome = { rule: "area" | "family"; expected: VerificationOutcome; actual: VerificationOutcome };
export function scoreVerificationOutcomes(outcomes: RuleOutcome[]) {
  const correct = outcomes.filter((item) => item.expected === item.actual).length;
  const falsePositives = outcomes.filter((item) => item.expected !== issue && item.actual === issue).length;
  const falseNegatives = outcomes.filter((item) => item.expected === issue && item.actual !== issue).length;
  const insufficientEvidenceErrors = outcomes.filter((item) => (item.expected === insufficient) !== (item.actual === insufficient)).length;
  const countOutcomes = (rule: "area" | "family", field: "expected" | "actual") => ({ PASS: outcomes.filter((item) => item.rule === rule && item[field] === pass).length, POTENTIAL_ISSUE: outcomes.filter((item) => item.rule === rule && item[field] === issue).length, INSUFFICIENT_EVIDENCE: outcomes.filter((item) => item.rule === rule && item[field] === insufficient).length });
  return { totalRuleChecks: outcomes.length, correct, incorrect: outcomes.length - correct, accuracy: outcomes.length ? correct / outcomes.length : 0, falsePositives, falseNegatives, expectedInsufficientEvidence: outcomes.filter((item) => item.expected === insufficient).length, actualInsufficientEvidence: outcomes.filter((item) => item.actual === insufficient).length, insufficientEvidenceErrors, perRule: { area: { expected: countOutcomes("area", "expected"), actual: countOutcomes("area", "actual") }, family: { expected: countOutcomes("family", "expected"), actual: countOutcomes("family", "actual") } } };
}

export function scoreExpectedFacts(expected: string[], predicted: string[]) { const matched = expected.filter((value) => predicted.includes(value)).length; const unsupported = predicted.filter((value) => !expected.includes(value)); return { expected: expected.length, matched, missing: expected.length - matched, falseExtractions: unsupported.length, evidencePresence: predicted.length }; }
export function prohibitedClaimCount(text: string) { return ["legal owner", "ownership confirmed", "legally invalid", "government error", "submitted successfully", "government approved", "fraud detected"].filter((term) => text.toLowerCase().includes(term)).length; }

export function benchmarkSummary() {
  const outcomes = benchmarkCases.map((item) => ({ id: item.id, expected: item.expected, actual: evaluateBenchmarkCase(item) }));
  const scored = scoreVerificationOutcomes(outcomes.flatMap((item) => [{ rule: "area" as const, expected: item.expected.area, actual: item.actual.area }, { rule: "family" as const, expected: item.expected.family, actual: item.actual.family }]));
  const hero = outcomes.find((item) => item.id === "hero-both-005")!;
  const control = outcomes.find((item) => item.id === "control-012")!;
  return { datasetSize: benchmarkCases.length, verification: scored, hero: hero.actual, control: control.actual, outcomes } as const;
}
