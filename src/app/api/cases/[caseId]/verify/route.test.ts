import { describe, expect, it } from "vitest";
import { GET as getVerification } from "@/app/api/cases/[caseId]/verification/route";
import { POST as runVerification } from "@/app/api/cases/[caseId]/verify/route";

const params = (caseId: string) => ({ params: Promise.resolve({ caseId }) });

describe("verification API", () => {
  it("persists and returns deterministic hero results", async () => {
    const response = await runVerification(new Request("http://localhost/api/cases/demo-family-001/verify", { method: "POST" }), params("demo-family-001"));
    expect(response.status).toBe(200);
    const body = await response.json() as { data: { ruleId: string; outcome: string }[] };
    expect(body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "AREA_CONSISTENCY", outcome: "POTENTIAL_ISSUE" }),
      expect.objectContaining({ ruleId: "FAMILY_CONTEXT", outcome: "POTENTIAL_ISSUE" }),
    ]));

    const persisted = await getVerification(new Request("http://localhost/api/cases/demo-family-001/verification"), params("demo-family-001"));
    expect(persisted.status).toBe(200);
    expect(await persisted.json()).toEqual({ data: body.data });
  });

  it("returns a dedicated not-found response for unknown cases", async () => {
    const response = await runVerification(new Request("http://localhost/api/cases/missing/verify", { method: "POST" }), params("missing"));
    expect(response.status).toBe(404);
  });
});
