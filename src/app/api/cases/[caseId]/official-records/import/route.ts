import { NextResponse } from "next/server";

import { caseApplicationService } from "@/server/case-application-service";
import { officialRecordService } from "@/server/official-record-service";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  if (!(await caseApplicationService.getCaseDetail(caseId))) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "The synthetic case was not found.",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: await officialRecordService.list(caseId) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const body = (await request.json().catch(() => null)) as {
    officialRecordId?: unknown;
  } | null;

  if (!body || typeof body.officialRecordId !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_IMPORT",
          message: "A synthetic record id is required.",
        },
      },
      { status: 400 },
    );
  }

  const result = await officialRecordService.import(caseId, body.officialRecordId);
  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "The synthetic case or record was not found.",
        },
      },
      { status: 404 },
    );
  }
  if (result.mismatch) return NextResponse.json(result, { status: 409 });

  return NextResponse.json(result);
}
