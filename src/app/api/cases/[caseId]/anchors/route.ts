import { NextResponse } from "next/server";
import { z } from "zod";
import { anchorService, VerificationResultNotFoundError } from "@/server/anchor-service";

export const runtime = "nodejs";

const anchorCreateSchema = z.object({
  resultId: z.string().min(1),
  signedBy: z.string().optional(),
}).strict();

export async function GET(_: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const anchors = await anchorService.listAnchors(caseId);
  return NextResponse.json({ data: anchors });
}

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const body = anchorCreateSchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "A valid resultId is required to anchor." } },
      { status: 400 }
    );
  }

  try {
    const anchor = await anchorService.anchorVerificationResult(
      caseId,
      body.data.resultId,
      body.data.signedBy
    );
    return NextResponse.json({ data: anchor }, { status: 201 });
  } catch (error) {
    if (error instanceof VerificationResultNotFoundError) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: error.message } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to anchor verification result." } },
      { status: 500 }
    );
  }
}
