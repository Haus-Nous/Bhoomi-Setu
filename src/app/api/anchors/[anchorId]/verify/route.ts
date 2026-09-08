import { NextResponse } from "next/server";
import { anchorService } from "@/server/anchor-service";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ anchorId: string }> }) {
  const { anchorId } = await params;
  const verification = await anchorService.verifyAnchor(anchorId);

  if (!verification) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Anchor record not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: verification });
}
