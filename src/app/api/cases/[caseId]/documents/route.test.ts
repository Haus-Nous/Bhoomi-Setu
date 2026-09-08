import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/cases/[caseId]/documents/route";
import { GET as getFixtures } from "@/app/api/cases/[caseId]/documents/fixtures/route";
import { GET as getDocument } from "@/app/api/cases/[caseId]/documents/[documentId]/route";
import { caseApplicationService } from "@/server/case-application-service";

const params = (caseId: string) => ({ params: Promise.resolve({ caseId }) });
const create = async (suffix: string) => await caseApplicationService.createCase({ district: "Demo District", circle: "Demo Circle", village: "Demo Mauza", khata: `DEMO-ATTACH-${suffix}`, nickname: `Synthetic attachment ${suffix}` });

describe("synthetic document attachment", () => {
  it("persists an approved fixture only in the selected new case", async () => {
    const first = await create(crypto.randomUUID().slice(0, 8));
    const second = await create(crypto.randomUUID().slice(0, 8));
    const firstId = first.case.id;
    const secondId = second.case.id;

    const initially = await GET(new Request(`http://localhost/api/cases/${firstId}/documents`), params(firstId));
    expect(await initially.json()).toEqual({ data: [] });

    const fixtures = await getFixtures(new Request(`http://localhost/api/cases/${firstId}/documents/fixtures`), params(firstId));
    const fixtureBody = await fixtures.json() as { data: { id: string; isSynthetic: boolean }[] };
    expect(fixtures.status).toBe(200);
    expect(fixtureBody.data.some((fixture) => fixture.id === "fixture-legacy-a" && fixture.isSynthetic)).toBe(true);

    const attached = await POST(new Request(`http://localhost/api/cases/${firstId}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId: "fixture-legacy-a" }) }), params(firstId));
    const attachedBody = await attached.json() as { data: { id: string; isSynthetic: boolean } };
    expect(attached.status).toBe(201);
    expect(attachedBody.data).toMatchObject({ id: `${firstId}-fixture-legacy-a`, isSynthetic: true });

    const duplicate = await POST(new Request(`http://localhost/api/cases/${firstId}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId: "fixture-legacy-a" }) }), params(firstId));
    expect(duplicate.status).toBe(200);

    const reloaded = await GET(new Request(`http://localhost/api/cases/${firstId}/documents`), params(firstId));
    expect((await reloaded.json() as { data: { id: string }[] }).data).toEqual([expect.objectContaining({ id: `${firstId}-fixture-legacy-a` })]);
    expect((await caseApplicationService.getCaseDetail(secondId))?.documents).toEqual([]);
  });

  it("rejects arbitrary attachment bodies, unknown fixtures, and cross-case document access", async () => {
    const first = await create(crypto.randomUUID().slice(0, 8));
    const second = await create(crypto.randomUUID().slice(0, 8));
    const invalid = await POST(new Request(`http://localhost/api/cases/${first.case.id}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId: `${second.case.id}-fixture-legacy-a` }) }), params(first.case.id));
    expect(invalid.status).toBe(400);

    const arbitraryBody = await POST(new Request(`http://localhost/api/cases/${first.case.id}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId: "fixture-legacy-a", sourceText: "private document", path: "/tmp/private.txt", url: "https://example.invalid" }) }), params(first.case.id));
    expect(arbitraryBody.status).toBe(400);

    const unknownFixture = await POST(new Request(`http://localhost/api/cases/${first.case.id}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId: "fixture-unknown" }) }), params(first.case.id));
    expect(unknownFixture.status).toBe(404);

    await POST(new Request(`http://localhost/api/cases/${first.case.id}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId: "fixture-legacy-a" }) }), params(first.case.id));
    const crossCase = await getDocument(new Request(`http://localhost/api/cases/${second.case.id}/documents/${first.case.id}-fixture-legacy-a`), { params: Promise.resolve({ caseId: second.case.id, documentId: `${first.case.id}-fixture-legacy-a` }) });
    expect(crossCase.status).toBe(404);
  });
});
