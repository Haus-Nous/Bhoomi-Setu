import type { DocumentItem, VerificationItem, VerificationOutcome } from "@/types/case";

export type VerificationSummary = Record<VerificationOutcome, number>;
export type VerificationSource = { id: string; label: string; type: string };

export function summarizeVerification(items: VerificationItem[]): VerificationSummary {
  return items.reduce<VerificationSummary>((summary, item) => ({ ...summary, [item.outcome]: summary[item.outcome] + 1 }), { PASS: 0, POTENTIAL_ISSUE: 0, INSUFFICIENT_EVIDENCE: 0 });
}

export function sourcesForVerification(item: VerificationItem, documents: DocumentItem[]): VerificationSource[] {
  return item.sourceDocumentIds.map((id) => {
    const document = documents.find((candidate) => candidate.id === id);
    return document ? { id: document.id, label: document.title, type: document.type } : { id, label: "", type: "" };
  });
}

export function outcomePresentation(outcome: VerificationOutcome) {
  if (outcome === "POTENTIAL_ISSUE") return { className: "warning", symbol: "!", labelKey: "potentialIssue" as const };
  if (outcome === "INSUFFICIENT_EVIDENCE") return { className: "review", symbol: "i", labelKey: "insufficientEvidence" as const };
  return { className: "passed", symbol: "✓", labelKey: "passed" as const };
}
