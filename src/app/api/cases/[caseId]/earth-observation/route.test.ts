import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/cases/[caseId]/earth-observation/route";
import { caseApplicationService } from "@/server/case-application-service";

const params = (caseId: string) => ({ params: Promise.resolve({ caseId }) });

describe("earth observation API", () => {
  it("returns the deterministic hero and stable control responses", async () => {
    const hero = await GET(new Request("http://localhost"), params("demo-family-001"));
    const control = await GET(new Request("http://localhost"), params("demo-family-002"));
    const heroBody = await hero.json() as { data: { overallClassification: string; snapshots: unknown[]; indicators: Array<{ classification: string }> } };
    const controlBody = await control.json() as { data: { overallClassification: string } };
    expect(hero.status).toBe(200);
    expect(heroBody.data.overallClassification).toBe("NOTICEABLE_CHANGE");
    expect(heroBody.data.snapshots).toHaveLength(2);
    expect(heroBody.data.indicators.every((item) => item.classification === "NOTICEABLE_CHANGE")).toBe(true);
    expect(control.status).toBe(200);
    expect(controlBody.data.overallClassification).toBe("STABLE");
  });

  it("returns safe insufficient evidence for a known new case and 404 for unknown cases", async () => {
    const created = await caseApplicationService.createCase({ district: "Demo District", circle: "Demo Circle", village: "Demo Mauza", khata: "DEMO-EARTH-API", nickname: "Synthetic API context gap" });
    const insufficient = await GET(new Request("http://localhost"), params(created.case.id));
    const missing = await GET(new Request("http://localhost"), params("missing-synthetic-case"));
    expect((await insufficient.json() as { data: { overallClassification: string } }).data.overallClassification).toBe("INSUFFICIENT_EVIDENCE");
    expect(missing.status).toBe(404);
  });
});
