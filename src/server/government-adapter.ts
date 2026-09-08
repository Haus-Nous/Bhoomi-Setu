import type { CaseDetail, SurveyRecord } from "@/types/case";
import { resolveSurveyWorkflowStage } from "@/server/survey-workflow";

export type GovernmentCaseContext = Pick<CaseDetail, "case" | "surveyRecord" | "landParcels">;
export type MockGovernmentResult<T> = { source: "MOCK_GOVERNMENT_ADAPTER"; synthetic: true; data: T; disclaimer: string };

export interface GovernmentAdapter {
  getSurveyStatus(context: GovernmentCaseContext): MockGovernmentResult<{ stageId: string; stage: string }>;
  getSurveyRecord(context: GovernmentCaseContext): MockGovernmentResult<SurveyRecord | null>;
  getAvailableActions(context: GovernmentCaseContext): MockGovernmentResult<string[]>;
}

export class MockGovernmentAdapter implements GovernmentAdapter {
  getSurveyStatus(context: GovernmentCaseContext) { const stage = resolveSurveyWorkflowStage(context.case.surveyStage); return { source: "MOCK_GOVERNMENT_ADAPTER" as const, synthetic: true as const, data: { stageId: stage.id, stage: context.case.surveyStage }, disclaimer: "Synthetic demo data only. This is not an official government status." }; }
  getSurveyRecord(context: GovernmentCaseContext) { return { source: "MOCK_GOVERNMENT_ADAPTER" as const, synthetic: true as const, data: context.surveyRecord ?? null, disclaimer: "Synthetic demo data only. This is not an official government record." }; }
  getAvailableActions(context: GovernmentCaseContext) { const stage = resolveSurveyWorkflowStage(context.case.surveyStage); return { source: "MOCK_GOVERNMENT_ADAPTER" as const, synthetic: true as const, data: stage.safeActions, disclaimer: "Synthetic demo data only. No government action can be submitted from BhoomiCheck." }; }
}

// Future approved integrations must implement GovernmentAdapter using documented, authorized interfaces only.
export const mockGovernmentAdapter = new MockGovernmentAdapter();
