"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CasePage } from "@/components/case-page";
import { useCaseActions } from "@/components/case-context";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { DocumentCard, EmptyState } from "@/components/domain";
import { OfficialRecordContext } from "@/components/official-record-context";
import { TraceabilityDetails } from "@/components/traceability-details";
import { useLocale, useTranslation } from "@/components/locale-context";
import { groupCaseEvidence } from "@/lib/evidence-presentation";
import { localizedExperiencePresentation } from "@/lib/i18n";
import type { CaseDetail, DocumentExtraction, DocumentItem, SyntheticDocumentFixture } from "@/types/case";

function DocumentWorkflow({
  document,
  selected,
  onInspect,
}: {
  document: DocumentItem;
  selected: boolean;
  onInspect: () => void;
}) {
  const c = useTranslation();
  return <div className="document-workflow"><DocumentCard document={document} /><div className="document-actions"><button type="button" className="button secondary" aria-expanded={selected} aria-controls={selected ? "extracted-fields" : undefined} onClick={onInspect}>{c.common.inspect}</button></div></div>;
}

function DocumentsContent({ detail, caseId }: { detail: CaseDetail; caseId: string }) {
  const c = useTranslation();
  const { locale } = useLocale();
  const experience = localizedExperiencePresentation(locale);
  const [selected, setSelected] = useState<string | null>(null);
  const [fixtures, setFixtures] = useState<SyntheticDocumentFixture[]>([]);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const { listFixtures, attachFixture } = useCaseActions();
  const evidence = groupCaseEvidence(detail.documents);

  useEffect(() => {
    void listFixtures(caseId).then(setFixtures).catch(() => setFixtures([]));
  }, [caseId, listFixtures]);

  const inspect = (documentId: string) => {
    setSelected(documentId);
    setExtraction(null);
    setError("");
  };

  const runExtraction = async (documentId: string) => {
    setExtracting(true);
    setError("");
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}/extract`, { method: "POST" });
      const body = await response.json() as { data?: DocumentExtraction };
      if (!response.ok || !body.data) throw new Error();
      setExtraction(body.data);
    } catch {
      setError(c.documents.extractionFailure);
    } finally {
      setExtracting(false);
    }
  };

  const item = detail.documents.find((document) => document.id === selected);
  return <main id="main" className="case-layout"><CaseNavigation caseId={caseId} /><div className="case-content"><CaseHeader title={c.documents.header} subtitle={c.documents.subtitle} />
    <section className="evidence-overview" aria-labelledby="core-evidence-title"><p className="eyebrow">{experience.documents.evidence}</p><h2 id="core-evidence-title">{experience.documents.core}</h2><p className="micro">{experience.documents.coreDetail}</p><aside className="evidence-safety"><strong>{experience.documents.safety}</strong></aside>{evidence.core.length ? <div className="document-list">{evidence.core.map((document) => <DocumentWorkflow key={document.id} document={document} selected={selected === document.id} onInspect={() => inspect(document.id)} />)}</div> : <EmptyState title={c.documents.noDocuments} detail={c.documents.noDocumentsDetail} />}<Link className="compact-action" href={`/cases/${caseId}/verification`}>{experience.documents.reviewVerification} <span aria-hidden>→</span></Link></section>
    <OfficialRecordContext caseId={caseId} variant="documents" />
    {evidence.supporting.length > 0 && <details className="supporting-evidence"><summary>{experience.documents.supporting} ({evidence.supporting.length})</summary><p className="micro">{experience.documents.supportingDetail}</p><div className="document-list">{evidence.supporting.map((document) => <DocumentWorkflow key={document.id} document={document} selected={selected === document.id} onInspect={() => inspect(document.id)} />)}</div></details>}
    <details className="fixture-panel"><summary>{experience.documents.addSupporting}</summary><div className="fixture-panel-content"><p className="micro">{experience.documents.supportingDetail}</p><div className="fixture-list">{fixtures.map((fixture) => <button key={fixture.id} type="button" className="button secondary" disabled={detail.documents.some((document) => document.id === `${caseId}-${fixture.id}`)} onClick={() => void attachFixture(caseId, fixture.id)}>{fixture.title}</button>)}</div><p className="micro">{c.documents.fixturesNotice}</p></div></details>
    {item && <section id="extracted-fields" className="inspect" aria-live="polite"><div className="section-head"><div><p className="eyebrow">{c.documents.source}</p><h2>{item.title}</h2></div><button className="button secondary" onClick={() => setSelected(null)}>{c.documents.close}</button></div><pre className="source-text">{item.sourceText}</pre><div className="section-head"><div><p className="eyebrow">{c.documents.extraction}</p><h2>{c.documents.suggested}</h2></div><button className="button small" disabled={extracting} onClick={() => void runExtraction(item.id)}>{extracting ? c.documents.extracting : c.documents.runExtraction}</button></div><p className="micro">{c.documents.extractionNotice}</p>{error && <p className="form-error" role="alert">{error}</p>}{extraction?.result?.facts.map((fact, index) => <div className="field-row" key={`${fact.key}-${index}`}><span>{fact.key}</span><strong>{fact.value}</strong><span><span className="confidence">{fact.confidence} {c.documents.extractionConfidence}</span><br />{c.labels.evidence}: “{fact.evidence.quote}”{fact.uncertainty ? ` · ${fact.uncertainty}` : ""}</span></div>)}<TraceabilityDetails summary={experience.documents.extractionTraceability}><p className="micro"><strong>{experience.documents.sourceRecord}:</strong> {item.id}</p>{extraction && <p className="micro"><strong>{c.labels.source}:</strong> {extraction.provider ?? c.labels.notAvailable} · {extraction.model ?? c.labels.notAvailable} · {extraction.promptVersion ?? c.labels.notAvailable}</p>}</TraceabilityDetails></section>}
  </div></main>;
}

export default function DocumentsPage() {
  return <CasePage>{(detail, caseId) => <DocumentsContent detail={detail} caseId={caseId} />}</CasePage>;
}
