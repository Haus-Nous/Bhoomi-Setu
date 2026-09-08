import { syntheticDocumentFixtures } from "@/fixtures/synthetic-documents";
import { documentFromFixture, SyntheticDocumentProcessor } from "@/services/document-processing";
import type { CreateCaseInput } from "@/services/case-service";
import type { CaseDetail, SyntheticDocumentFixture } from "@/types/case";

const acres = (value: number) => ({ value, unit: "acres" as const });
const processor = new SyntheticDocumentProcessor();
const fixture = (caseId: string, fixtureId: string) => processor.process(documentFromFixture(caseId, syntheticDocumentFixtures.find((item) => item.id === fixtureId)!));

function demoCase(id: string, nickname: string, place: { district: string; circle: string; village: string }, parcel: { khata: string; khesra: string; area: number }, documents: string[]): CaseDetail {
  const record = fixture(id, "fixture-survey-a");
  return { case: { id, nickname, location: place, surveyStage: "Synthetic documents ready to review", progress: { done: documents.length ? 3 : 1, total: 5 } }, landParcels: [{ id: `${id}-parcel`, label: `Synthetic parcel for ${nickname}`, khata: parcel.khata, khesra: parcel.khesra, area: acres(parcel.area) }], family: { members: [{ id: `${id}-elder`, name: `Synthetic Elder ${nickname.slice(-3)}`, role: "Grandparent", note: "Named in a synthetic record" }, { id: `${id}-parent`, name: `Synthetic Parent ${nickname.slice(-3)}`, role: "Parent", note: "Named in a synthetic family note" }], relationships: [{ id: `${id}-relationship`, fromMemberId: `${id}-elder`, toMemberId: `${id}-parent`, label: "parent of" }] }, documents: documents.map((fixtureId) => fixture(id, fixtureId)), surveyRecord: { recordedName: `Synthetic Elder ${nickname.slice(-3)}`, khata: parcel.khata, khesra: parcel.khesra, area: acres(parcel.area), surveyStage: "Synthetic documents ready to review", mapReference: `DEMO-MAP-${nickname.slice(-3)}` }, verification: [], nextAction: { recommendedTitle: "Review your synthetic documents", recommendedDetail: "Inspect each extracted field before taking any next step.", steps: ["Open a synthetic document.", "Read the extracted fields and source text."], options: [{ id: "review", title: "Review supporting document", detail: "Read the synthetic record and its extracted fields." }] }, timeline: [{ id: `${id}-created`, dateLabel: "Step 1", title: "Case created", detail: "Your synthetic case is ready.", status: "done" }, { id: `${id}-documents`, dateLabel: "Step 2", title: "Documents added", detail: `${documents.length} synthetic records are in this case.`, status: documents.length ? "current" : "upcoming" }] };
}

class MockCaseRepository {
  private readonly cases = new Map<string, CaseDetail>([
    ["demo-family-001", demoCase("demo-family-001", "Demo Case 001", { district: "Demo District", circle: "Demo Circle", village: "Example Mauza A" }, { khata: "DEMO-128", khesra: "DEMO-456", area: 0.82 }, ["fixture-legacy-a", "fixture-family-a", "fixture-survey-a"])],
    ["demo-family-002", demoCase("demo-family-002", "Demo Case 002", { district: "Sample District", circle: "Sample Circle", village: "Example Mauza B" }, { khata: "DEMO-902", khesra: "DEMO-114", area: 1.25 }, ["fixture-family-a"])]
  ]);
  async getCase(caseId: string) { return this.cases.get(caseId) ?? null; }
  async createCase(input: CreateCaseInput): Promise<CaseDetail> { const id = `demo-created-${Date.now()}`; const detail = demoCase(id, input.nickname, { district: input.district, circle: input.circle, village: input.village }, { khata: input.khata, khesra: input.khesra || "Not added", area: 0 }, []); this.cases.set(id, detail); return detail; }
  async listDocumentFixtures(): Promise<SyntheticDocumentFixture[]> { return syntheticDocumentFixtures; }
  async attachFixture(caseId: string, fixtureId: string): Promise<CaseDetail | null> { const detail = this.cases.get(caseId); const item = syntheticDocumentFixtures.find((candidate) => candidate.id === fixtureId); if (!detail || !item) return null; if (!detail.documents.some((document) => document.kind === item.kind)) detail.documents.push(documentFromFixture(caseId, item)); return detail; }
  async processDocument(caseId: string, documentId: string): Promise<CaseDetail | null> { const detail = this.cases.get(caseId); const index = detail?.documents.findIndex((document) => document.id === documentId) ?? -1; if (!detail || index < 0) return null; detail.documents[index] = processor.process({ ...detail.documents[index], state: "processing" }); return detail; }
}
export const mockCaseRepository = new MockCaseRepository();
