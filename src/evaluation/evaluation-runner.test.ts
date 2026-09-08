import { expect, it } from "vitest";
import { benchmarkSummary } from "@/evaluation/benchmark";

it("prints the deterministic BhoomiCheck evaluation summary", async () => {
  const summary = benchmarkSummary();
  console.log(`BhoomiCheck deterministic evaluation\nDataset: ${summary.datasetSize} synthetic cases\nVerification: ${summary.verification.correct}/${summary.verification.totalRuleChecks} correct (${(summary.verification.accuracy * 100).toFixed(1)}%)\nIncorrect: ${summary.verification.incorrect}\nFalse positives: ${summary.verification.falsePositives}\nFalse negatives: ${summary.verification.falseNegatives}\nExpected / actual insufficient evidence: ${summary.verification.expectedInsufficientEvidence}/${summary.verification.actualInsufficientEvidence}\nInsufficient-evidence classification errors: ${summary.verification.insufficientEvidenceErrors}\nHero: AREA=${summary.hero.area}, FAMILY=${summary.hero.family}\nControl: AREA=${summary.control.area}, FAMILY=${summary.control.family}`);
  expect(summary.verification.accuracy).toBe(1);
});
