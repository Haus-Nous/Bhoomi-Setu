import { describe, expect, it } from "vitest";
import { caseApplicationService } from "@/server/case-application-service";
import { mockGovernmentAdapter } from "@/server/government-adapter";
import { resolveSurveyWorkflowStage } from "@/server/survey-workflow";

describe("mock government adapter", () => {
  it("returns deterministic synthetic-only information without a network dependency", async () => {
    const detail = (await caseApplicationService.getCaseDetail("demo-family-001"))!;
    const first = mockGovernmentAdapter.getSurveyStatus(detail);
    expect(mockGovernmentAdapter.getSurveyStatus(detail)).toEqual(first);
    expect(first).toMatchObject({ source: "MOCK_GOVERNMENT_ADAPTER", synthetic: true });
    expect(first.disclaimer).toContain("not an official government status");
  });

  it("keeps workflow meaning equivalent across English and Hindi configuration", async () => {
    const stage = resolveSurveyWorkflowStage("Synthetic records ready to review");
    expect(stage.label.en).not.toBe(stage.label.hi);
    expect(stage.safeActions).toEqual(["review record differences", "prepare a mock review packet"]);
    expect(stage.caution.hi).toContain("आधिकारिक");
  });
});
