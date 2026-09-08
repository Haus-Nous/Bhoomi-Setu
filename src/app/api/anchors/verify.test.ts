import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { POST as postAnchor, GET as getAnchors } from "@/app/api/cases/[caseId]/anchors/route";
import { GET as getPublicVerify } from "@/app/api/anchors/[anchorId]/verify/route";
import { CaseApplicationService } from "@/server/case-application-service";
import { verificationService } from "@/server/verification-service";
import { getDatabase, resetDatabaseForTests, setDatabaseForTests, LocalSqliteAdapter } from "@/server/database";

const caseParams = (caseId: string) => ({ params: Promise.resolve({ caseId }) });
const anchorParams = (anchorId: string) => ({ params: Promise.resolve({ anchorId }) });

describe("Anchor & Verifier API Routes", () => {
  beforeEach(async () => {
    setDatabaseForTests(new LocalSqliteAdapter(":memory:"));
    const db = getDatabase();
    await db.initialize();
    const cases = new CaseApplicationService();
    await cases.getCaseDetail("demo-family-001");
    await verificationService.run("demo-family-001");
  });

  afterEach(() => {
    resetDatabaseForTests();
  });

  it("creates an anchor and lists anchors for a case", async () => {
    const postReq = new Request("http://localhost/api/cases/demo-family-001/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultId: "demo-family-001-area-consistency",
        signedBy: "Officer Raman",
      }),
    });

    const postRes = await postAnchor(postReq, caseParams("demo-family-001"));
    expect(postRes.status).toBe(201);
    const postBody = await postRes.json();
    expect(postBody.data).toMatchObject({
      case_id: "demo-family-001",
      subject_id: "demo-family-001-area-consistency",
      signed_by: "Officer Raman",
    });

    // List anchors
    const getReq = new Request("http://localhost/api/cases/demo-family-001/anchors");
    const getRes = await getAnchors(getReq, caseParams("demo-family-001"));
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: postBody.data.id }),
    ]));
  });

  it("validates input on POST /api/cases/:caseId/anchors", async () => {
    // Missing resultId
    const invalidReq = new Request("http://localhost/api/cases/demo-family-001/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const invalidRes = await postAnchor(invalidReq, caseParams("demo-family-001"));
    expect(invalidRes.status).toBe(400);

    // Non-existent resultId
    const notFoundReq = new Request("http://localhost/api/cases/demo-family-001/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId: "non-existent-result" }),
    });
    const notFoundRes = await postAnchor(notFoundReq, caseParams("demo-family-001"));
    expect(notFoundRes.status).toBe(404);
  });

  it("publicly verifies anchor integrity via GET /api/anchors/:anchorId/verify", async () => {
    // First create an anchor
    const postReq = new Request("http://localhost/api/cases/demo-family-001/anchors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultId: "demo-family-001-family-context",
      }),
    });
    const postRes = await postAnchor(postReq, caseParams("demo-family-001"));
    const anchor = (await postRes.json()).data;

    // Public verify route
    const verifyReq = new Request(`http://localhost/api/anchors/${anchor.id}/verify`);
    const verifyRes = await getPublicVerify(verifyReq, anchorParams(anchor.id));
    expect(verifyRes.status).toBe(200);

    const verifyBody = await verifyRes.json();
    expect(verifyBody.data).toMatchObject({
      matches: true,
      storedHash: anchor.payload_hash,
      recomputedHash: anchor.payload_hash,
      signedBy: "Demo Verification Officer",
      caseReference: "Case demo-family-001",
    });

    // Check unknown anchorId returns 404
    const notFoundVerifyReq = new Request("http://localhost/api/anchors/anc_unknown/verify");
    const notFoundVerifyRes = await getPublicVerify(notFoundVerifyReq, anchorParams("anc_unknown"));
    expect(notFoundVerifyRes.status).toBe(404);
  });
});
