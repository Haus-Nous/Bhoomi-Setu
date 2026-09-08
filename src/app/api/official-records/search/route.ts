import { NextResponse } from "next/server";
import { officialRecordService } from "@/server/official-record-service";
export const runtime = "nodejs";
export async function POST(request: Request) { const result = await officialRecordService.search(await request.json().catch(() => null)); return result ? NextResponse.json(result) : NextResponse.json({ error: { code: "INVALID_SYNTHETIC_SEARCH", message: "District, circle, mauza, and either Khata or Khesra are required." } }, { status: 400 }); }
