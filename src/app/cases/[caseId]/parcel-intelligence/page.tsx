"use client";

import { CasePage } from "@/components/case-page";
import { ParcelIntelligencePanel } from "@/components/parcel-intelligence-panel";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { useTranslation } from "@/components/locale-context";

export default function ParcelIntelligencePage() {
  const c = useTranslation().parcel;
  return <CasePage>{(detail, caseId) => <main id="main" className="case-layout"><CaseNavigation caseId={caseId} /><div className="case-content"><CaseHeader title={c.header} subtitle={c.subtitle} /><ParcelIntelligencePanel caseId={caseId} /></div></main>}</CasePage>;
}
