import { describe, expect, it } from "vitest";
import { earthObservationService, classifySyntheticContextChange } from "@/server/earth-observation-service";
import { caseApplicationService } from "@/server/case-application-service";
import { parcelIntelligenceService } from "@/server/parcel-intelligence-service";
import { verificationService } from "@/server/verification-service";

describe("earth observation service", () => {
  it("classifies the hero fixture deterministically without making a legal inference", async () => {
    const insight = await earthObservationService.get("demo-family-001");
    expect(insight).toMatchObject({ caseId: "demo-family-001", overallClassification: "NOTICEABLE_CHANGE", provider: "SYNTHETIC_IMAGERY_PROVIDER", provenance: "SYNTHETIC_CONTEXT_FIXTURE", safety: { synthetic: true, authoritative: false, legalEvidence: false } });
    expect(insight?.indicators.map((item) => ({ type: item.type, earlier: item.earlierValue, later: item.laterValue, delta: item.deltaPercentagePoints, classification: item.classification }))).toEqual([
      { type: "VEGETATION_CHANGE", earlier: 68, later: 49, delta: -19, classification: "NOTICEABLE_CHANGE" },
      { type: "BUILT_UP_CHANGE", earlier: 12, later: 27, delta: 15, classification: "NOTICEABLE_CHANGE" },
    ]);
  });

  it("keeps the control stable and returns insufficient evidence when no fixture exists", async () => {
    expect((await earthObservationService.get("demo-family-002"))?.overallClassification).toBe("STABLE");
    const created = await caseApplicationService.createCase({ district: "Demo District", circle: "Demo Circle", village: "Demo Mauza", khata: "DEMO-EARTH-NO-FIXTURE", nickname: "Synthetic context gap" });
    const insight = await earthObservationService.get(created.case.id);
    expect(insight).toMatchObject({ overallClassification: "INSUFFICIENT_EVIDENCE", snapshots: [], provenance: "NO_SYNTHETIC_FIXTURE" });
    expect(insight?.indicators.every((item) => item.classification === "INSUFFICIENT_EVIDENCE")).toBe(true);
  });

  it("uses fixed demo thresholds and does not change Phase 17 or verification outputs", async () => {
    expect(classifySyntheticContextChange(4)).toBe("STABLE");
    expect(classifySyntheticContextChange(5)).toBe("SMALL_CHANGE");
    expect(classifySyntheticContextChange(11)).toBe("NOTICEABLE_CHANGE");
    expect(classifySyntheticContextChange(null)).toBe("INSUFFICIENT_EVIDENCE");
    const before = await parcelIntelligenceService.get("demo-family-001");
    const verificationBefore = await verificationService.run("demo-family-001");
    await earthObservationService.get("demo-family-001");
    expect((await parcelIntelligenceService.get("demo-family-001"))?.areaSources.map((source) => source.sourceType)).toEqual(["DOCUMENT_RECORD", "SURVEY_RECORD", "GEOMETRY_CALCULATED"]);
    expect(await parcelIntelligenceService.get("demo-family-001")).toEqual(before);
    expect(await verificationService.run("demo-family-001")).toEqual(verificationBefore);
  });
});
