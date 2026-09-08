import { NextResponse } from "next/server";
import { reviewPacketService } from "@/server/review-packet-service";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ caseId: string }> }) { const { caseId } = await params; return NextResponse.json({ data: await reviewPacketService.list(caseId) }); }
const packetCreateSchema = z.object({ verificationResultId: z.string().regex(/^[a-z0-9-]+$/i) }).strict();
export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) { const { caseId } = await params; const body = packetCreateSchema.safeParse(await request.json().catch(() => null)); if (!body.success) return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Choose a valid potential issue to prepare." } }, { status: 400 }); try { return NextResponse.json({ data: await reviewPacketService.create(caseId, body.data.verificationResultId) }, { status: 201 }); } catch (error) { const code = error instanceof Error ? error.message : "INVALID_INPUT"; return NextResponse.json({ error: { code: code === "CASE_NOT_FOUND" ? code : "PACKET_UNAVAILABLE", message: "This packet could not be prepared from the selected result." } }, { status: code === "CASE_NOT_FOUND" ? 404 : 422 }); } }
