import type { DocumentItem } from "@/types/case";

export type DocumentEvidenceGroups = {
  core: DocumentItem[];
  supporting: DocumentItem[];
};

/** Presentation grouping only. It never changes a document's stored type, state, or extraction. */
export function groupCaseEvidence(documents: DocumentItem[]): DocumentEvidenceGroups {
  return documents.reduce<DocumentEvidenceGroups>(
    (groups, document) => {
      if (document.id.includes("-fixture-")) groups.supporting.push(document);
      else groups.core.push(document);
      return groups;
    },
    { core: [], supporting: [] },
  );
}
