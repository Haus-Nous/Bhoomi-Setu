import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/cases/[caseId]/parcel-intelligence/route";
import { caseApplicationService } from "@/server/case-application-service";

const params = (caseId: string) => ({ params: Promise.resolve({ caseId }) });

describe("parcel intelligence API", () => {
  it("returns the isolated hero geometry and contextual recorded areas", async () => {
    const response = await GET(new Request("http://localhost"), params("demo-family-001"));
    const body = await response.json() as { data: { parcel: { khata: string; khesra?: string }; geometry: { caseId: string; provenance: string; sourceReference: string } | null; calculatedArea: { squareMeters: number; acres: number; provenance: string } | null; recordedAreas: { historical: { value: number } | null; survey: { value: number } | null }; areaSources: Array<{ sourceType: string; normalizedAcres: number | null }>; pairwiseComparisons: Array<{ status: string }>; comparisonSummary: { key: string }; comparisonPolicy: { policyId: string; consistentThresholdPercent: number; reviewThresholdPercent: number } } };
    expect(response.status).toBe(200);
    expect(body.data.parcel).toMatchObject({ khata: "DEMO-128", khesra: "DEMO-456" });
    expect(body.data.geometry).toMatchObject({ caseId: "demo-family-001", provenance: "SYNTHETIC", sourceReference: "BHOOMICHECK-SYNTHETIC-GEO-001-V2" });
    expect(body.data.calculatedArea).toMatchObject({ provenance: "CALCULATED_FROM_GEOMETRY" });
    expect(body.data.calculatedArea?.acres).toBeGreaterThanOrEqual(1.02);
    expect(body.data.calculatedArea?.acres).toBeLessThanOrEqual(1.03);
    expect(body.data.recordedAreas).toEqual({ historical: { value: 1.2, unit: "acre" }, survey: { value: 1.02, unit: "acre" } });
    expect(body.data.areaSources).toHaveLength(3);
    expect(body.data.pairwiseComparisons.map((comparison) => comparison.status)).toEqual(["POTENTIAL_ISSUE", "POTENTIAL_ISSUE", "CONSISTENT"]);
    expect(body.data.comparisonSummary.key).toBe("HISTORICAL_DIFFERS_SURVEY_AND_GEOMETRY_ALIGN");
    expect(body.data.comparisonPolicy).toMatchObject({ policyId: "BHOOMICHECK_DEMO_AREA_V1", consistentThresholdPercent: 2, reviewThresholdPercent: 5 });
  });

  it("keeps the control geometry isolated and gives new cases a safe geometry empty state", async () => {
    const control = await GET(new Request("http://localhost"), params("demo-family-002"));
    const controlBody = await control.json() as { data: { parcel: { khata: string; khesra?: string }; geometry: { id: string; caseId: string; provenance: string; sourceReference: string } | null; calculatedArea: { acres: number } | null; pairwiseComparisons: Array<{ status: string }>; comparisonSummary: { key: string } } };
    expect(controlBody.data.parcel.khata).toBe("DEMO-902");
    expect(controlBody.data.parcel.khesra).toBe("DEMO-114");
    expect(controlBody.data.geometry).toMatchObject({ id: "demo-family-002-geometry", caseId: "demo-family-002", provenance: "SYNTHETIC", sourceReference: "BHOOMICHECK-SYNTHETIC-GEO-002" });
    expect(controlBody.data.calculatedArea?.acres).toBeGreaterThanOrEqual(1.24);
    expect(controlBody.data.calculatedArea?.acres).toBeLessThanOrEqual(1.26);
    expect(controlBody.data.pairwiseComparisons.every((comparison) => comparison.status === "CONSISTENT")).toBe(true);
    expect(controlBody.data.comparisonSummary.key).toBe("ALL_AREA_SOURCES_CLOSELY_ALIGNED");
    const created = await caseApplicationService.createCase({ district: "Demo District", circle: "Demo Circle", village: "Demo Mauza", khata: "DEMO-GEO-NEW-001", nickname: "Synthetic unmapped case" });
    const fresh = await GET(new Request("http://localhost"), params(created.case.id));
    const freshBody = await fresh.json() as { data: { geometry: null; calculatedArea: null } };
    expect(fresh.status).toBe(200);
    expect(freshBody.data).toMatchObject({ geometry: null, calculatedArea: null });
  });
});
