import { caseService, type CaseService } from "@/services/case-service";
import type { CaseDetail } from "@/types/case";
import type { Locale } from "@/lib/i18n";

export type ResolvedCaseRoute = { status: "ready"; detail: CaseDetail } | { status: "not-found" } | { status: "error"; message: string };
export async function resolveCaseRoute(caseId: string, service: CaseService = caseService, locale: Locale = "en"): Promise<ResolvedCaseRoute> { try { const detail = await service.getCase(caseId, locale); return detail ? { status: "ready", detail } : { status: "not-found" }; } catch { return { status: "error", message: "We could not load this case. Please try again." }; } }
