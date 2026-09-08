import type { DocumentItem, ExtractedField, SyntheticDocumentFixture } from "@/types/case";

const field = (id: string, label: string, value: string, source: string): ExtractedField => ({ id, label, value, confidence: 100, source });
const readLine = (text: string, label: string) => text.match(new RegExp(`^${label}:\\s*(.+)$`, "mi"))?.[1]?.trim();

export interface DocumentProcessor { process(document: DocumentItem): DocumentItem; }
export interface OcrAdapter { extractText(fixture: SyntheticDocumentFixture): Promise<string>; }
export class SyntheticOcrAdapter implements OcrAdapter { async extractText(fixture: SyntheticDocumentFixture) { return fixture.sourceText; } }

export class SyntheticDocumentProcessor implements DocumentProcessor {
  process(document: DocumentItem): DocumentItem {
    const fields: ExtractedField[] = [];
    const source = "Synthetic fixture text";
    const khata = readLine(document.sourceText, "Khata"); if (khata) fields.push(field(`${document.id}-khata`, "Khata number", khata, source));
    const khesra = readLine(document.sourceText, "Khesra"); if (khesra) fields.push(field(`${document.id}-khesra`, "Khesra number", khesra, source));
    const name = readLine(document.sourceText, "Recorded name") ?? readLine(document.sourceText, "Grandparent"); if (name) fields.push(field(`${document.id}-name`, "Recorded name", name, source));
    const area = readLine(document.sourceText, "Area"); if (area) fields.push(field(`${document.id}-area`, "Area", area, source));
    const relationship = readLine(document.sourceText, "Relationship"); if (relationship) fields.push(field(`${document.id}-relationship`, "Relationship", relationship, source));
    const mapReference = readLine(document.sourceText, "Map reference"); if (mapReference) fields.push(field(`${document.id}-map`, "Map reference", mapReference, source));
    return { ...document, fields, state: "extracted" };
  }
}

export function documentFromFixture(caseId: string, fixture: SyntheticDocumentFixture): DocumentItem { return { id: `${caseId}-${fixture.id}`, title: fixture.title, kind: fixture.kind, type: fixture.type, addedLabel: "Added just now", state: "not-started", fields: [], sourceText: fixture.sourceText, isSynthetic: true }; }
