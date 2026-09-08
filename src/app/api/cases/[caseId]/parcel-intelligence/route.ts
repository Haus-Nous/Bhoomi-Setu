import { NextResponse } from "next/server";
import { parcelIntelligenceService } from "@/server/parcel-intelligence-service";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const intelligence = await parcelIntelligenceService.get(caseId);
  if (!intelligence) return NextResponse.json({ error: { code: "PARCEL_NOT_FOUND", message: "No parcel information is available for this synthetic case." } }, { status: 404 });
  return NextResponse.json({ data: intelligence });
}
