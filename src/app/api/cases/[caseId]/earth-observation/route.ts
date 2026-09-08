import { NextResponse } from "next/server";
import { earthObservationService } from "@/server/earth-observation-service";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const insight = await earthObservationService.get(caseId);
  if (!insight) return NextResponse.json({ error: { code: "CASE_NOT_FOUND", message: "No synthetic case was found for this contextual imagery view." } }, { status: 404 });
  return NextResponse.json({ data: insight });
}
