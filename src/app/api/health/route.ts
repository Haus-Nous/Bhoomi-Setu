import { NextResponse } from "next/server";
import { DatabaseConfigurationError, getDatabase } from "@/server/database";
export const runtime = "nodejs";
export async function GET() { try { await getDatabase().ping(); return NextResponse.json({ status: "ok", mode: "synthetic-demo", database: "available" }); } catch (error) { const status = error instanceof DatabaseConfigurationError ? 503 : 503; return NextResponse.json({ status: "unhealthy", mode: "synthetic-demo", database: "unavailable" }, { status }); } }
