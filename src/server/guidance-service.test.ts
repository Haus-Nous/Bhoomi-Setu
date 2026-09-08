import { describe, expect, it } from "vitest";
import { documentApplicationService } from "@/server/document-application-service";
import { guidanceService } from "@/server/guidance-service";
import { verificationService } from "@/server/verification-service";

const guidanceFor = async (caseId: string) => guidanceService.build(caseId, (await verificationService.run(caseId))!, await documentApplicationService.list(caseId));

describe("deterministic next-action guidance", () => {
  it("maps the hero area result to an ordered review action with actual documents", async () => {
    const item = (await guidanceFor("demo-family-001")).find((guidance) => guidance.ruleId === "AREA_CONSISTENCY")!;
    expect(item).toMatchObject({ status: "READY_TO_REVIEW", priority: 10, verificationResultId: "demo-family-001-area-consistency" });
    expect(item.documentIds).toEqual(expect.arrayContaining(["demo-family-001-historical", "demo-family-001-survey"]));
  });

  it("maps the hero family result to a separate ordered review action", async () => {
    const item = (await guidanceFor("demo-family-001")).find((guidance) => guidance.ruleId === "FAMILY_CONTEXT")!;
    expect(item).toMatchObject({ status: "READY_TO_REVIEW", priority: 20, verificationResultId: "demo-family-001-family-context" });
    expect(item.documentIds).toEqual(expect.arrayContaining(["demo-family-001-genealogy", "demo-family-001-survey"]));
  });

  it("orders potential issues before evidence and no-action guidance", async () => {
    const items = guidanceService.build("mixed", [
      { ...(await verificationService.run("demo-family-001"))![0], outcome: "PASS", id: "pass" },
      ...((await verificationService.run("demo-family-001"))!),
    ], await documentApplicationService.list("demo-family-001"));
    expect(items.map((item) => item.status).slice(0, 2)).toEqual(["READY_TO_REVIEW", "READY_TO_REVIEW"]);
    expect(items.at(-1)?.status).toBe("NO_ACTION_NEEDED");
  });

  it("keeps the control case informational without false urgency", async () => {
    const items = await guidanceFor("demo-family-002");
    expect(items.some((item) => item.status === "NEEDS_MORE_INFORMATION")).toBe(true);
    expect(items.some((item) => item.status === "NO_ACTION_NEEDED")).toBe(true);
    expect(items.some((item) => item.status === "READY_TO_REVIEW")).toBe(false);
  });

  it("is deterministic and isolated by case", async () => {
    const hero = await guidanceFor("demo-family-001");
    expect(await guidanceFor("demo-family-001")).toEqual(hero);
    const control = await guidanceFor("demo-family-002");
    expect(control.every((item) => item.caseId === "demo-family-002")).toBe(true);
    expect(control).not.toEqual(hero);
  });

  it("localizes citizen-facing guidance without changing deterministic meaning or traceability", async () => {
    const verification = (await verificationService.run("demo-family-001"))!;
    const documents = await documentApplicationService.list("demo-family-001");
    const english = guidanceService.build("demo-family-001", verification, documents, "en");
    const hindi = guidanceService.build("demo-family-001", verification, documents, "hi");
    expect(hindi.map(({ id, verificationResultId, ruleId, priority, status, documentIds, sourceVerificationResultIds }) => ({ id, verificationResultId, ruleId, priority, status, documentIds, sourceVerificationResultIds }))).toEqual(english.map(({ id, verificationResultId, ruleId, priority, status, documentIds, sourceVerificationResultIds }) => ({ id, verificationResultId, ruleId, priority, status, documentIds, sourceVerificationResultIds })));
    expect(hindi[0]?.title).not.toBe(english[0]?.title);
    expect(hindi[0]?.caution).toContain("तैयारी");
  });
});
