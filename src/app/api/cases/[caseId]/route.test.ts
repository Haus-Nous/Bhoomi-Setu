import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cases/[caseId]/route";
import { caseApplicationService } from "@/server/case-application-service";
import { verificationService } from "@/server/verification-service";

const params = (caseId: string) => ({ params: Promise.resolve({ caseId }) });

describe("case detail guidance integration", () => {
  it("returns deterministic guidance with the selected case detail", async () => {
    const response = await GET(new Request("http://localhost/api/cases/demo-family-001"), params("demo-family-001"));
    const body = await response.json() as { data: { guidance: { caseId: string; status: string; ruleId: string }[]; governmentProcess: { source: string; synthetic: boolean } } };
    expect(response.status).toBe(200);
    expect(body.data.guidance).toEqual(expect.arrayContaining([
      expect.objectContaining({ caseId: "demo-family-001", ruleId: "AREA_CONSISTENCY", status: "READY_TO_REVIEW" }),
      expect.objectContaining({ caseId: "demo-family-001", ruleId: "FAMILY_CONTEXT", status: "READY_TO_REVIEW" }),
    ]));
    expect(body.data.governmentProcess).toEqual(expect.objectContaining({ source: "MOCK_GOVERNMENT_ADAPTER", synthetic: true }));
  });
  it("does not replace persisted verification when locale-specific guidance reloads", async () => {
    await caseApplicationService.resetSeedCase("demo-family-001");
    const run = vi.spyOn(verificationService, "run");
    await GET(new Request("http://localhost/api/cases/demo-family-001"), params("demo-family-001"));
    await GET(new Request("http://localhost/api/cases/demo-family-001", { headers: { "x-bhoomi-locale": "hi" } }), params("demo-family-001"));
    expect(run).toHaveBeenCalledTimes(1);
    run.mockRestore();
  });
});
