"use client";

import Link from "next/link";
import { CasePage } from "@/components/case-page";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { CaseProgress, DocumentCard, NextActionCard, VerificationSummary } from "@/components/domain";
import { useLocale, useTranslation } from "@/components/locale-context";
import { EarthObservationTeaser } from "@/components/earth-observation-panel";
import { OfficialRecordContext } from "@/components/official-record-context";
import { ParcelIntelligenceTeaser } from "@/components/parcel-intelligence-panel";
import { localizedPeopleCount } from "@/lib/i18n";

export default function Dashboard() {
  const c = useTranslation();
  const { locale } = useLocale();
  return <CasePage>{(detail, caseId) => {
    const parcel = detail.landParcels[0];
    const potentialIssues = detail.verification.filter((item) => item.outcome === "POTENTIAL_ISSUE");
    const recommendedGuidance = detail.guidance?.find((item) => item.status === "READY_TO_REVIEW") ?? detail.guidance?.[0];
    return <main id="main" className="case-layout"><CaseNavigation caseId={caseId} /><div className="case-content"><CaseHeader title={detail.case.nickname} subtitle={`${detail.case.location.village} · Khata ${parcel?.khata || c.common.notAdded}${parcel?.khesra ? ` · Khesra ${parcel.khesra}` : ""}`} /><CaseProgress {...detail.case.progress} />
      <section className="dashboard-grid dashboard-overview">
        <article className="summary-card"><p className="eyebrow">{c.dashboard.surveyStage}</p><h2>{detail.case.surveyStage}</h2><p>{c.dashboard.surveyDetail}</p><Link className="compact-action" href={`/cases/${caseId}/survey-record`}>{c.dashboard.openSurvey} <span aria-hidden>→</span></Link></article>
        <article className="summary-card"><p className="eyebrow">{c.dashboard.landSummary}</p><h2>{parcel ? `${parcel.area.value} ${parcel.area.unit}` : c.dashboard.noParcel}</h2><p>{parcel ? `Khata ${parcel.khata} · Khesra ${parcel.khesra || c.common.notAdded}` : c.dashboard.addLand}</p><Link className="compact-action" href={`/cases/${caseId}/survey-record`}>{c.dashboard.recordedDetails} <span aria-hidden>→</span></Link></article>
        <article className="summary-card"><p className="eyebrow">{c.dashboard.familySummary}</p><h2>{localizedPeopleCount(locale, detail.family.members.length)}</h2><p>{detail.family.members.length ? c.dashboard.familyAvailable : c.dashboard.noFamily}</p><Link className="compact-action" href={`/cases/${caseId}/family`}>{c.dashboard.viewFamily} <span aria-hidden>→</span></Link></article>
      </section>
      {detail.verification.length > 0 && <section className="dashboard-attention" aria-labelledby="dashboard-attention-title"><div><p id="dashboard-attention-title" className="eyebrow">{c.dashboard.attention}</p><p className="micro">{c.dashboard.attentionDetail}</p></div><VerificationSummary items={detail.verification} compact /><Link href={`/cases/${caseId}/verification`} className="button secondary dashboard-review-link">{c.verification.overviewLink} <span aria-hidden>→</span></Link></section>}
      {recommendedGuidance && <section className="dashboard-next-action" aria-labelledby="dashboard-next-action-title"><p className="eyebrow">{c.dashboard.prepareNext}</p><h2 id="dashboard-next-action-title">{potentialIssues.length ? `${potentialIssues.length} ${c.dashboard.differences}` : c.dashboard.continuePreparing}</h2><NextActionCard emphasis href={`/cases/${caseId}/next-action`} title={recommendedGuidance.title} detail={recommendedGuidance.explanation} /></section>}
      <section className="dashboard-evidence" aria-labelledby="dashboard-evidence-title"><div className="section-head"><div><p className="eyebrow">{c.dashboard.evidenceContext}</p><h2 id="dashboard-evidence-title">{c.dashboard.evidenceContext}</h2><p className="micro">{c.dashboard.evidenceContextDetail}</p></div></div><div className="dashboard-grid dashboard-evidence-grid"><ParcelIntelligenceTeaser caseId={caseId} /><OfficialRecordContext caseId={caseId} compact /><EarthObservationTeaser caseId={caseId} compact /></div></section>
      <section className="section-head"><div><p className="eyebrow">{c.dashboard.documents}</p><h2>{c.dashboard.recordsPlace}</h2></div><Link href={`/cases/${caseId}/documents`} className="compact-action">{c.dashboard.viewAll} <span aria-hidden>→</span></Link></section><div className="document-list">{detail.documents.slice(0, 2).map((document) => <DocumentCard document={document} key={document.id} href={`/cases/${caseId}/documents`} />)}</div>
    </div></main>;
  }}</CasePage>;
}
