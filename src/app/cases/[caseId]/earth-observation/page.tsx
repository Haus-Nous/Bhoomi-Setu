"use client";

import { CasePage } from "@/components/case-page";
import { EarthObservationPanel } from "@/components/earth-observation-panel";
import { useLocale } from "@/components/locale-context";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { localizedEarthObservationPresentation } from "@/lib/i18n";

export default function EarthObservationPage() {
  const { locale } = useLocale();
  const c = localizedEarthObservationPresentation(locale);
  return <CasePage>{(_, caseId) => <main id="main" className="case-layout"><CaseNavigation caseId={caseId} /><div className="case-content"><CaseHeader title={c.header} subtitle={c.subtitle} /><EarthObservationPanel caseId={caseId} /></div></main>}</CasePage>;
}
