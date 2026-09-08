import { describe, expect, it } from "vitest";
import { caseApplicationService } from "@/server/case-application-service";
import { documentApplicationService } from "@/server/document-application-service";
import { guidanceService } from "@/server/guidance-service";
import { reviewPacketService } from "@/server/review-packet-service";
import { buildTimeline } from "@/server/case-state-service";
import { verificationService } from "@/server/verification-service";

describe("judge-ready synthetic journeys", () => {
  it("exposes the complete evidence-backed hero journey", async () => {
    await documentApplicationService.ensureSeedDocuments();
    const detail = (await caseApplicationService.getCaseDetail("demo-family-001"))!;
    const verification = (await verificationService.run("demo-family-001"))!;
    const area = verification.find((item) => item.ruleId === "AREA_CONSISTENCY")!;
    const family = verification.find((item) => item.ruleId === "FAMILY_CONTEXT")!;
    const guidance = guidanceService.build(detail.case.id, verification, await documentApplicationService.list(detail.case.id));
    const packet = await reviewPacketService.create(detail.case.id, area.id);
    const timeline = buildTimeline({ ...detail, verification, guidance }, await reviewPacketService.list(detail.case.id));

    expect(detail.documents.length).toBeGreaterThanOrEqual(6);
    expect(area).toMatchObject({ outcome: "POTENTIAL_ISSUE", sourceDocumentIds: ["demo-family-001-historical", "demo-family-001-survey"] });
    expect(family).toMatchObject({ outcome: "POTENTIAL_ISSUE", sourceDocumentIds: ["demo-family-001-genealogy", "demo-family-001-survey"] });
    expect(guidance.length).toBeGreaterThan(0);
    expect(packet.supportingDocumentIds).toEqual(expect.arrayContaining(area.sourceDocumentIds));
    expect(timeline.some((event) => event.title === "Verification completed")).toBe(true);
  });

  it("keeps the control from fabricating hero discrepancies", async () => {
    await documentApplicationService.ensureSeedDocuments();
    const verification = (await verificationService.run("demo-family-002"))!;
    expect(verification.find((item) => item.ruleId === "AREA_CONSISTENCY")?.outcome).toBe("PASS");
    expect(verification.find((item) => item.ruleId === "FAMILY_CONTEXT")?.outcome).toBe("INSUFFICIENT_EVIDENCE");
  });
});
