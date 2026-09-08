import { NextResponse } from "next/server";
import { caseApplicationService } from "@/server/case-application-service";
import { verificationService } from "@/server/verification-service";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ caseId: string }> }) { const { caseId } = await params; if (!await caseApplicationService.getCaseDetail(caseId)) return NextResponse.json({ error: { code: "CASE_NOT_FOUND", message: "Synthetic case not found." } }, { status: 404 }); return NextResponse.json({ data: await verificationService.list(caseId) }); }
