"use client";
import { useParams } from "next/navigation";
import { useCaseDetail } from "@/components/case-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/domain";
import { useTranslation } from "@/components/locale-context";
import type { CaseDetail } from "@/types/case";

export function CasePage({ children }: { children: (detail: CaseDetail, caseId: string) => React.ReactNode }) { const params = useParams<{ caseId: string }>(); const caseId = params.caseId; const state = useCaseDetail(caseId); const c = useTranslation(); if (state.status === "loading") return <main id="main"><LoadingState /></main>; if (state.status === "not-found") return <main id="main"><EmptyState title={c.caseStates.notFoundTitle} detail={c.caseStates.notFoundDetail} /></main>; if (state.status === "error") return <main id="main"><ErrorState /></main>; return <>{children(state.detail, caseId)}</>; }
