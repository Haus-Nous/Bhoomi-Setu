import { describe, expect, it } from "vitest";
import { benchmarkCases, benchmarkSummary, evaluateBenchmarkCase, prohibitedClaimCount, scoreExpectedFacts, scoreVerificationOutcomes } from "@/evaluation/benchmark";

describe("synthetic evaluation benchmark", () => {
  it("has explicit synthetic ground truth across clean, issue, and insufficient-evidence cases", async () => {
    expect(benchmarkCases).toHaveLength(12);
    expect(benchmarkCases.every((item) => item.id.includes("demo") === false)).toBe(true);
    expect(benchmarkCases.find((item) => item.id === "hero-both-005")?.expected).toMatchObject({ area: "POTENTIAL_ISSUE", family: "POTENTIAL_ISSUE" });
    expect(benchmarkCases.find((item) => item.id === "control-012")?.expected.family).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("uses the production VerificationService for benchmark outcomes", async () => {
    const format = benchmarkCases.find((item) => item.id === "clean-format-002")!;
    expect(evaluateBenchmarkCase(format)).toEqual({ area: "PASS", family: "PASS" });
    expect(benchmarkSummary().verification).toMatchObject({ totalRuleChecks: 24, correct: 24, incorrect: 0, falsePositives: 0, falseNegatives: 0, insufficientEvidenceErrors: 0 });
  });

  it("calculates confusion metrics from actual outcomes instead of constants", async () => {
    const score = scoreVerificationOutcomes([{ rule: "area", expected: "PASS", actual: "POTENTIAL_ISSUE" }, { rule: "family", expected: "POTENTIAL_ISSUE", actual: "INSUFFICIENT_EVIDENCE" }, { rule: "family", expected: "INSUFFICIENT_EVIDENCE", actual: "PASS" }]);
    expect(score).toMatchObject({ totalRuleChecks: 3, correct: 0, incorrect: 3, accuracy: 0, falsePositives: 1, falseNegatives: 1, expectedInsufficientEvidence: 1, actualInsufficientEvidence: 1, insufficientEvidenceErrors: 2 });
  });

  it("scores deterministic extraction facts separately from live-model accuracy", async () => {
    expect(scoreExpectedFacts(["DEMO-128", "1.20 acre"], ["DEMO-128", "1.20 acre", "invented"])).toEqual({ expected: 2, matched: 2, missing: 0, falseExtractions: 1, evidencePresence: 3 });
  });

  it("checks grounding templates for prohibited claims", async () => {
    expect(prohibitedClaimCount("Possible mismatch; review the source records.")).toBe(0);
    expect(prohibitedClaimCount("Government approved and ownership confirmed.")).toBe(2);
  });
});
