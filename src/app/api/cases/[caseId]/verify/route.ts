import { NextResponse } from "next/server";
import { caseApplicationService } from "@/server/case-application-service";
import { verificationService } from "@/server/verification-service";
export const runtime = "nodejs";
export async function POST(_: Request, { params }: { params: Promise<{ caseId: string }> }) { const { caseId } = await params; if (!await caseApplicationService.getCaseDetail(caseId)) return NextResponse.json({ error: { code: "CASE_NOT_FOUND", message: "Synthetic case not found." } }, { status: 404 }); const results = await verificationService.run(caseId); return results ? NextResponse.json({ data: results }) : NextResponse.json({ error: { code: "INSUFFICIENT_EVIDENCE", message: "No synthetic documents are available." } }, { status: 422 }); }
