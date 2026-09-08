"use client";
import Link from "next/link";
import { CasePage } from "@/components/case-page";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { Timeline } from "@/components/domain";
import { useTranslation } from "@/components/locale-context";
export default function TimelinePage() { const c = useTranslation().timeline; return <CasePage>{(detail, caseId) => { const packet = detail.reviewPackets?.find((item) => item.status === "READY_FOR_REVIEW"); const href = packet ? `/cases/${caseId}/review-packet?packet=${encodeURIComponent(packet.id)}` : `/cases/${caseId}/next-action`; const label = packet ? c.reviewPacket : c.continuePreparation; return <main id="main" className="case-layout"><CaseNavigation caseId={caseId} /><div className="case-content"><CaseHeader title={c.header} subtitle={c.subtitle} />{detail.timeline.length ? <Timeline events={detail.timeline} /> : <p className="state">{c.empty}</p>}<div className="actions"><Link className="button" href={href}>{label}</Link><Link className="button secondary" href={`/cases/${caseId}`}>{c.back}</Link></div></div></main>; }}</CasePage>; }
