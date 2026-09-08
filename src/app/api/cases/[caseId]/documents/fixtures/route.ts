import { NextResponse } from "next/server";
import { caseApplicationService } from "@/server/case-application-service";
import { documentApplicationService } from "@/server/document-application-service";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  if (!await caseApplicationService.getCaseDetail(caseId)) return NextResponse.json({ error: { code: "CASE_NOT_FOUND", message: "Case not found." } }, { status: 404 });
  return NextResponse.json({ data: documentApplicationService.listSyntheticFixtures() });
}
