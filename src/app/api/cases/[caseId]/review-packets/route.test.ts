import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/cases/[caseId]/review-packets/route";
import { GET, PATCH } from "@/app/api/cases/[caseId]/review-packets/[packetId]/route";

const params = (caseId: string) => ({ params: Promise.resolve({ caseId }) });

describe("review packet write boundary", () => {
  it("rejects a cross-case verification result", async () => {
    const response = await POST(new Request("http://localhost/api/cases/demo-family-002/review-packets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationResultId: "demo-family-001-area-consistency" }) }), params("demo-family-002"));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: { code: "PACKET_UNAVAILABLE", message: "This packet could not be prepared from the selected result." } });
  });

  it("returns a safe validation error for malformed or unsupported input", async () => {
    const response = await POST(new Request("http://localhost/api/cases/demo-family-001/review-packets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationResultId: "bad value", extra: true }) }), params("demo-family-001"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "INVALID_INPUT", message: "Choose a valid potential issue to prepare." } });
  });

  it("keeps packet retrieval and mutation scoped to its case", async () => {
    const created = await POST(new Request("http://localhost/api/cases/demo-family-001/review-packets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationResultId: "demo-family-001-family-context" }) }), params("demo-family-001"));
    const packet = await created.json() as { data: { id: string } };
    const ownParams = { params: Promise.resolve({ caseId: "demo-family-001", packetId: packet.data.id }) };
    const retrieved = await GET(new Request("http://localhost"), ownParams);
    expect(retrieved.status).toBe(200);
    expect((await retrieved.json() as { data: { id: string } }).data.id).toBe(packet.data.id);
    const otherParams = { params: Promise.resolve({ caseId: "demo-family-002", packetId: packet.data.id }) };
    expect((await GET(new Request("http://localhost"), otherParams)).status).toBe(404);
    expect((await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ citizenNotes: "cross case" }) }), otherParams)).status).toBe(404);
  });

  it("returns a conflict when a prepared packet is edited", async () => {
    const created = await POST(new Request("http://localhost/api/cases/demo-family-001/review-packets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verificationResultId: "demo-family-001-area-consistency" }) }), params("demo-family-001"));
    const packet = await created.json() as { data: { id: string; status: string } };
    const packetParams = { params: Promise.resolve({ caseId: "demo-family-001", packetId: packet.data.id }) };
    if (packet.data.status === "DRAFT") expect((await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "READY_FOR_REVIEW" }) }), packetParams)).status).toBe(200);
    const locked = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ citizenNotes: "change after ready" }) }), packetParams);
    expect(locked.status).toBe(409);
    expect(await locked.json()).toEqual({ error: { code: "PACKET_LOCKED", message: "Prepared packets are frozen. Create a new draft to make changes." } });
  });
});
