import { NextResponse } from "next/server";
import { documentApplicationService } from "@/server/document-application-service";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ caseId: string; documentId: string }> }) { const { caseId, documentId } = await params; await documentApplicationService.ensureSeedDocuments(); const document = await documentApplicationService.get(caseId, documentId); return document ? NextResponse.json({ data: { document, preparedDocument: await documentApplicationService.prepare(caseId, documentId) } }) : NextResponse.json({ error: { code: "DOCUMENT_NOT_FOUND", message: "Synthetic document not found." } }, { status: 404 }); }
