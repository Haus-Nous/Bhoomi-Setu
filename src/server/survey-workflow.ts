import type { Locale } from "@/lib/i18n";

export type SurveyWorkflowStage = { id: "SYNTHETIC_CASE_CREATED" | "SYNTHETIC_RECORDS_READY"; label: Record<Locale, string>; explanation: Record<Locale, string>; relevantInformation: string[]; safeActions: string[]; nextStage?: "SYNTHETIC_RECORDS_READY"; caution: Record<Locale, string> };

export const surveyWorkflow: Record<SurveyWorkflowStage["id"], SurveyWorkflowStage> = {
  SYNTHETIC_CASE_CREATED: { id: "SYNTHETIC_CASE_CREATED", label: { en: "Synthetic case created", hi: "सिंथेटिक केस बनाया गया" }, explanation: { en: "This local demo case is ready for synthetic records. No government process has started.", hi: "यह स्थानीय डेमो केस सिंथेटिक रिकॉर्ड के लिए तैयार है। कोई सरकारी प्रक्रिया शुरू नहीं हुई है।" }, relevantInformation: ["synthetic case details", "synthetic Khata/Khesra identifiers"], safeActions: ["add or inspect a synthetic record"], nextStage: "SYNTHETIC_RECORDS_READY", caution: { en: "This stage is a BhoomiCheck demo label, not an official survey status.", hi: "यह चरण BhoomiCheck का डेमो लेबल है, आधिकारिक सर्वे स्थिति नहीं।" } },
  SYNTHETIC_RECORDS_READY: { id: "SYNTHETIC_RECORDS_READY", label: { en: "Synthetic records ready to review", hi: "सिंथेटिक रिकॉर्ड समीक्षा के लिए तैयार" }, explanation: { en: "Synthetic records can be compared and prepared for citizen review.", hi: "सिंथेटिक रिकॉर्ड की तुलना और नागरिक समीक्षा की तैयारी की जा सकती है।" }, relevantInformation: ["synthetic documents", "survey record", "verification evidence"], safeActions: ["review record differences", "prepare a mock review packet"], caution: { en: "This is not an official government status or deadline.", hi: "यह आधिकारिक सरकारी स्थिति या समय-सीमा नहीं है।" } }
};

export function resolveSurveyWorkflowStage(stage: string): SurveyWorkflowStage { return stage === "Synthetic case created" ? surveyWorkflow.SYNTHETIC_CASE_CREATED : surveyWorkflow.SYNTHETIC_RECORDS_READY; }
