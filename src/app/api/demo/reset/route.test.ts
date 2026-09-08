import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/demo/reset/route";
import { caseApplicationService } from "@/server/case-application-service";
import { reviewPacketService } from "@/server/review-packet-service";
import { parcelGeometryService } from "@/server/parcel-geometry-service";
import { officialRecordService } from "@/server/official-record-service";

const request = (body: unknown) => new Request("http://localhost/api/demo/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("seed-only demo reset", () => {
  it("restores one approved hero demo without touching an arbitrary synthetic case", async () => {
    const arbitrary = await caseApplicationService.createCase({ district: "Demo District", circle: "Demo Circle", village: "Example Mauza", khata: "DEMO-RESET-001", nickname: "Synthetic reset isolation case" });
    await reviewPacketService.create("demo-family-001", "demo-family-001-area-consistency");
    await officialRecordService.import("demo-family-001", "synthetic-official-hero-001");
    const response = await POST(request({ caseId: "demo-family-001" }));
    expect(response.status).toBe(200);
    expect((await caseApplicationService.getCaseDetail(arbitrary.case.id))?.case.id).toBe(arbitrary.case.id);
    expect(await reviewPacketService.list("demo-family-001")).toEqual([]);
    expect(await officialRecordService.list("demo-family-001")).toEqual([]);
    expect((await caseApplicationService.getCaseDetail("demo-family-001"))?.case.nickname).toBe("Demo Case 001");
    expect(await parcelGeometryService.getForParcel("demo-family-001", "demo-family-001-parcel", "DEMO-128", "DEMO-456")).toMatchObject({ id: "demo-family-001-geometry", provenance: "SYNTHETIC" });
    expect(await parcelGeometryService.getForParcel(arbitrary.case.id, `${arbitrary.case.id}-parcel`, "DEMO-RESET-001")).toBeNull();
  });

  it("rejects arbitrary-case reset requests", async () => {
    expect((await POST(request({ caseId: "demo-case-anything" }))).status).toBe(400);
    expect((await POST(request({ caseId: "demo-family-001", deleteAll: true }))).status).toBe(400);
  });
});
