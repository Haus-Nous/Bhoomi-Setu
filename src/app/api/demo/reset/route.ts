import { NextResponse } from "next/server";
import { z } from "zod";
import { caseApplicationService } from "@/server/case-application-service";
import { documentApplicationService } from "@/server/document-application-service";

export const runtime = "nodejs";

const resetSchema = z.object({ caseId: z.enum(["demo-family-001", "demo-family-002"]) }).strict();

/** Resets exactly one approved seed case; it never deletes arbitrary created cases. */
export async function POST(request: Request) {
  const body = resetSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: { code: "INVALID_DEMO_CASE", message: "Choose an approved synthetic demo case to reset." } }, { status: 400 });
  const detail = await caseApplicationService.resetSeedCase(body.data.caseId);
  if (!detail) return NextResponse.json({ error: { code: "DEMO_CASE_NOT_FOUND", message: "That synthetic demo case is not available." } }, { status: 404 });
  await documentApplicationService.ensureSeedDocuments();
  return NextResponse.json({ data: { caseId: detail.case.id, reset: true } });
}
