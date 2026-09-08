import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/cases/[caseId]/documents/[documentId]/extract/route";
import { documentApplicationService } from "@/server/document-application-service";

const params = (caseId: string, documentId: string) => ({ params: Promise.resolve({ caseId, documentId }) });

describe("synthetic extraction boundary", () => {
  it("rejects a document from another synthetic case before any extraction provider is invoked", async () => {
    await documentApplicationService.ensureSeedDocuments();
    expect(await documentApplicationService.prepare("demo-family-001", "demo-family-001-historical")).not.toBeNull();
    const crossCase = params("demo-family-002", "demo-family-001-historical");
    expect((await GET(new Request("http://localhost"), crossCase)).status).toBe(404);
    expect((await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "arbitrary citizen text" }) }), crossCase)).status).toBe(404);
  });

  it("returns a safe unavailable response when no provider is explicitly configured", async () => {
    const priorProvider = process.env.AI_EXTRACTION_PROVIDER;
    const priorGemini = process.env.GEMINI_API_KEY;
    const priorOpenAI = process.env.OPENAI_API_KEY;
    try {
      delete process.env.AI_EXTRACTION_PROVIDER;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      await documentApplicationService.ensureSeedDocuments();
      const response = await POST(new Request("http://localhost", { method: "POST" }), params("demo-family-001", "demo-family-001-historical"));
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ error: { code: "AI_UNAVAILABLE" } });
    } finally {
      if (priorProvider === undefined) delete process.env.AI_EXTRACTION_PROVIDER; else process.env.AI_EXTRACTION_PROVIDER = priorProvider;
      if (priorGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = priorGemini;
      if (priorOpenAI === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = priorOpenAI;
    }
  });
});
