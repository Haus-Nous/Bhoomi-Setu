import { describe, expect, it } from "vitest";
import { documentApplicationService } from "@/server/document-application-service";
import { verificationService } from "@/server/verification-service";
import { outcomePresentation, sourcesForVerification, summarizeVerification } from "@/lib/verification-presentation";

describe("verification presentation data", () => {
  it("exposes both hero discrepancies with persisted compared values and sources", async () => {
    const results = (await verificationService.run("demo-family-001"))!;
    const documents = await documentApplicationService.list("demo-family-001");
    const area = results.find((item) => item.ruleId === "AREA_CONSISTENCY")!;
    const family = results.find((item) => item.ruleId === "FAMILY_CONTEXT")!;
    expect(area).toMatchObject({ outcome: "POTENTIAL_ISSUE", expectedValue: "1.20 acre", observedValue: "1.02 acre" });
    expect(family).toMatchObject({ outcome: "POTENTIAL_ISSUE", expectedValue: "Synthetic Child B 001", observedValue: "Synthetic Child A 001" });
    expect(sourcesForVerification(area, documents).map((source) => source.id)).toEqual(["demo-family-001-historical", "demo-family-001-survey"]);
  });

  it("presents the control case as insufficient evidence, never a hero discrepancy", async () => {
    const results = (await verificationService.run("demo-family-002"))!;
    const summary = summarizeVerification(results);
    expect(summary.POTENTIAL_ISSUE).toBe(0);
    expect(summary.INSUFFICIENT_EVIDENCE).toBeGreaterThan(0);
    expect(outcomePresentation("INSUFFICIENT_EVIDENCE").className).toBe("review");
  });
});
