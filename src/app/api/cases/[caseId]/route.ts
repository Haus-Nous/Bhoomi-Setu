import { NextResponse } from "next/server";
import { caseApplicationService } from "@/server/case-application-service";
import { documentApplicationService } from "@/server/document-application-service";
import { verificationService } from "@/server/verification-service";
import { guidanceService } from "@/server/guidance-service";
import { reviewPacketService } from "@/server/review-packet-service";
import { buildTimeline } from "@/server/case-state-service";
import { mockGovernmentAdapter } from "@/server/government-adapter";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ caseId: string }> }) { const { caseId } = await params; const locale = request.headers.get("x-bhoomi-locale") === "hi" ? "hi" : "en"; await documentApplicationService.ensureSeedDocuments(); const detail = await caseApplicationService.getCaseDetail(caseId); if (!detail) return NextResponse.json({ error: { code: "CASE_NOT_FOUND", message: "This synthetic case was not found." } }, { status: 404 }); if (!detail.verification.length) await verificationService.run(caseId); const refreshed = (await caseApplicationService.getCaseDetail(caseId))!; const guidance = guidanceService.build(caseId, refreshed.verification, refreshed.documents, locale); const packets = await reviewPacketService.list(caseId); const status = mockGovernmentAdapter.getSurveyStatus(refreshed); const actions = mockGovernmentAdapter.getAvailableActions(refreshed); return NextResponse.json({ data: { ...refreshed, guidance, reviewPackets: packets, governmentProcess: { source: status.source, synthetic: status.synthetic, status: status.data, availableActions: actions.data, disclaimer: status.disclaimer }, timeline: buildTimeline({ ...refreshed, guidance }, packets) } }); }
