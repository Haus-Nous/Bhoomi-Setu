import type { Locale } from "@/lib/i18n";
import type { DocumentItem, GuidanceItem, VerificationItem } from "@/types/case";
import { measure, metrics } from "@/server/metrics";

function relatedDocuments(item: VerificationItem, documents: DocumentItem[]) {
  const supportingIds = documents.filter((document) => document.id.endsWith("current") || document.id.endsWith("support")).map((document) => document.id);
  return [...new Set([...item.sourceDocumentIds, ...supportingIds])];
}

function text(locale: Locale, en: string, hi: string) { return locale === "hi" ? hi : en; }

function checklist(ruleId: VerificationItem["ruleId"], status: GuidanceItem["status"], locale: Locale) {
  if (status === "NEEDS_MORE_INFORMATION") return [{ id: "records", label: text(locale, "Keep the available related records together.", "उपलब्ध संबंधित रिकॉर्ड साथ रखें।") }, { id: "missing", label: text(locale, "Note which comparable record or value is still unavailable.", "नोट करें कि कौन सा तुलनीय रिकॉर्ड या मूल्य अभी उपलब्ध नहीं है।") }];
  if (status === "NO_ACTION_NEEDED") return [{ id: "retain", label: text(locale, "Keep the compared record references together for later review.", "बाद की समीक्षा के लिए तुलना किए रिकॉर्ड संदर्भ साथ रखें।") }];
  if (ruleId === "AREA_CONSISTENCY") return [{ id: "areas", label: text(locale, "Review both area values side by side.", "दोनों क्षेत्रफल मूल्यों को साथ रखकर देखें।") }, { id: "identifiers", label: text(locale, "Confirm the parcel identifiers match across the records.", "पुष्टि करें कि रिकॉर्ड में प्लॉट पहचानकर्ता मिलते हैं।") }, { id: "context", label: text(locale, "Note any measurement, update, or subdivision context that needs clarification.", "माप, अपडेट या उप-विभाजन से जुड़ा कोई स्पष्टीकरण नोट करें।") }, { id: "references", label: text(locale, "Keep the relevant record references together.", "संबंधित रिकॉर्ड संदर्भ साथ रखें।") }];
  return [{ id: "genealogy", label: text(locale, "Review the genealogy entry named in the comparison.", "तुलना में दिए Vanshavali (वंशावली) प्रविष्टि को देखें।") }, { id: "holder", label: text(locale, "Compare the current holder context with that entry.", "वर्तमान धारक संदर्भ की उस प्रविष्टि से तुलना करें।") }, { id: "identifiers", label: text(locale, "Confirm the parcel identifiers match across the related records.", "संबंधित रिकॉर्ड में प्लॉट पहचानकर्ता मिलते हैं या नहीं, पुष्टि करें।") }, { id: "references", label: text(locale, "Keep the relevant record references together.", "संबंधित रिकॉर्ड संदर्भ साथ रखें।") }];
}

function forResult(caseId: string, item: VerificationItem, documents: DocumentItem[], locale: Locale): GuidanceItem {
  const potential = item.outcome === "POTENTIAL_ISSUE";
  const insufficient = item.outcome === "INSUFFICIENT_EVIDENCE";
  const status = potential ? "READY_TO_REVIEW" : insufficient ? "NEEDS_MORE_INFORMATION" : "NO_ACTION_NEEDED";
  const area = item.ruleId === "AREA_CONSISTENCY";
  const title = potential ? area ? text(locale, "Review the differing area values", "अलग क्षेत्रफल मूल्यों की समीक्षा करें") : text(locale, "Review the family and holder context", "परिवार और धारक संदर्भ की समीक्षा करें") : insufficient ? area ? text(locale, "Gather comparable area information", "तुलनीय क्षेत्रफल जानकारी जुटाएं") : text(locale, "Gather comparable family-context information", "तुलनीय परिवार-संदर्भ जानकारी जुटाएं") : area ? text(locale, "No immediate area review suggested", "अभी क्षेत्रफल समीक्षा का सुझाव नहीं") : text(locale, "No immediate family-context review suggested", "अभी परिवार-संदर्भ समीक्षा का सुझाव नहीं");
  const explanation = potential ? area ? text(locale, "Review the historical/supporting record and survey entry together. BhoomiCheck does not determine which value is correct.", "ऐतिहासिक/सहायक रिकॉर्ड और सर्वे प्रविष्टि को साथ देखें। BhoomiCheck यह तय नहीं करता कि कौन सा मूल्य सही है।") : text(locale, "Review the genealogy/family record against the current holder and survey context. BhoomiCheck does not determine ownership or inheritance.", "वंशावली/परिवार रिकॉर्ड की वर्तमान धारक और सर्वे संदर्भ से तुलना करें। BhoomiCheck स्वामित्व या विरासत तय नहीं करता।") : insufficient ? text(locale, "More comparable information is needed before this check can be assessed.", "इस जाँच का आकलन करने से पहले और तुलनीय जानकारी चाहिए।") : text(locale, "No immediate action is suggested for this check based on the compared synthetic records.", "तुलना किए गए सिंथेटिक रिकॉर्ड के आधार पर इस जाँच के लिए कोई तत्काल कदम नहीं सुझाया गया है।");
  return { id: `${caseId}-guidance-${item.id}`, caseId, verificationResultId: item.id, ruleId: item.ruleId, title, explanation, priority: potential ? area ? 10 : 20 : insufficient ? area ? 70 : 80 : area ? 90 : 100, status, documentIds: relatedDocuments(item, documents), checklist: checklist(item.ruleId, status, locale), caution: text(locale, "This is preparation only. BhoomiCheck cannot decide which record is legally correct, submit a request, or make an official correction.", "यह केवल तैयारी के लिए है। BhoomiCheck यह तय नहीं कर सकता कि कौन सा रिकॉर्ड कानूनी रूप से सही है, अनुरोध जमा कर सकता है, या आधिकारिक सुधार कर सकता है।"), sourceVerificationResultIds: [item.id] };
}

export class GuidanceService {
  build(caseId: string, verification: VerificationItem[], documents: DocumentItem[], locale: Locale = "en") { return measure(metrics, "guidance", () => verification.map((item) => forResult(caseId, item, documents, locale)).sort((left, right) => left.priority - right.priority), { caseId, results: verification.length, locale }); }
}

export const guidanceService = new GuidanceService();
