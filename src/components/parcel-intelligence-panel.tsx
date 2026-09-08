"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, LoadingState } from "@/components/domain";
import { useLocale, useTranslation } from "@/components/locale-context";
import { ParcelMap } from "@/components/parcel-map";
import { TraceabilityDetails } from "@/components/traceability-details";
import { OfficialRecordContext } from "@/components/official-record-context";
import { EarthObservationTeaser } from "@/components/earth-observation-panel";
import { localizedExperiencePresentation, localizedParcelComparisonPresentation } from "@/lib/i18n";
import type { ParcelAreaComparisonStatus, ParcelAreaSource, ParcelIntelligence } from "@/types/geospatial";

const format = (value: number, digits: number) => value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
const sourceLabel = (source: ParcelAreaSource, c: ReturnType<typeof localizedParcelComparisonPresentation>) => source.sourceType === "DOCUMENT_RECORD" ? c.historical : source.sourceType === "SURVEY_RECORD" ? c.survey : c.geometry;
const statusLabel = (status: ParcelAreaComparisonStatus, c: ReturnType<typeof localizedParcelComparisonPresentation>) => status === "CONSISTENT" ? c.consistent : status === "REVIEW" ? c.review : status === "POTENTIAL_ISSUE" ? c.potential : c.insufficient;

function AreaSourceCard({ caseId, source, c, traceability }: { caseId: string; source: ParcelAreaSource; c: ReturnType<typeof localizedParcelComparisonPresentation>; traceability: string }) {
  const href = source.sourceType === "GEOMETRY_CALCULATED" ? null : `/cases/${caseId}/documents`;
  return <article className="area-source-card"><p className="eyebrow">{sourceLabel(source, c)}</p><strong>{source.normalizedAcres === null ? c.unavailable : `${format(source.normalizedAcres, 4)} acre`}</strong><p><b>{c.source}:</b> {href ? <Link className="text-link" href={href}>{source.sourceLabel}</Link> : source.sourceLabel}</p><TraceabilityDetails summary={traceability}><p className="micro"><b>{c.provenance}:</b> {source.provenance} · {source.sourceReference}</p></TraceabilityDetails></article>;
}

export function ParcelIntelligencePanel({ caseId }: { caseId: string }) {
  const translated = useTranslation().parcel;
  const { locale } = useLocale();
  const [state, setState] = useState<{ data: ParcelIntelligence | null; error: boolean }>({ data: null, error: false });
  useEffect(() => { const controller = new AbortController(); void fetch(`/api/cases/${encodeURIComponent(caseId)}/parcel-intelligence`, { signal: controller.signal }).then(async (response) => response.ok ? response.json() as Promise<{ data: ParcelIntelligence }> : Promise.reject()).then(({ data }) => setState({ data, error: false })).catch(() => { if (!controller.signal.aborted) setState({ data: null, error: true }); }); return () => controller.abort(); }, [caseId]);
  if (state.error) return <EmptyState title={translated.emptyTitle} detail={translated.emptyDetail} />;
  if (!state.data) return <LoadingState />;
  const { parcel, geometry, calculatedArea, areaSources, pairwiseComparisons, comparisonSummary, comparisonPolicy } = state.data;
  const c = localizedParcelComparisonPresentation(locale, comparisonSummary.key);
  const experience = localizedExperiencePresentation(locale);
  return <div className="parcel-intelligence">
    {geometry ? <ParcelMap geometry={geometry.geometry} label={`${translated.mappedParcel}: Khata ${parcel.khata}, Khesra ${parcel.khesra || translated.notAvailable}`} loadingLabel={translated.mapLoading} unavailableLabel={translated.mapUnavailable} backgroundUnavailableLabel={translated.mapBackgroundUnavailable} /> : <EmptyState title={translated.emptyTitle} detail={translated.emptyDetail} />}
    <aside className="parcel-safety"><strong>{experience.parcel.safety}</strong><p>{translated.safetyDetail}</p></aside>
    <section className="parcel-details" aria-label={translated.identity}><div><p className="eyebrow">{translated.identity}</p><h2>{translated.mappedParcel}</h2><dl><div><dt>Khata (खाता)</dt><dd>{parcel.khata}</dd></div><div><dt>Khesra (खेसरा)</dt><dd>{parcel.khesra || translated.notAvailable}</dd></div><div><dt>Mauza (मौजा)</dt><dd>{parcel.mauza}</dd></div><div><dt>{translated.circle}</dt><dd>{parcel.circle}</dd></div><div><dt>{translated.district}</dt><dd>{parcel.district}</dd></div></dl></div>{geometry ? <div><p className="eyebrow">{translated.geometry}</p><h2>{geometry.geometryType}</h2><p className="micro">{translated.calculatedFromGeometry}</p><TraceabilityDetails summary={experience.parcel.traceability}><dl className="traceability-list"><div><dt>{translated.source}</dt><dd>{geometry.sourceReference}</dd></div><div><dt>{translated.provenance}</dt><dd>{geometry.provenance}</dd></div><div><dt>{translated.calculatedArea}</dt><dd>{translated.calculatedFromGeometry}</dd></div></dl></TraceabilityDetails></div> : <div><p className="eyebrow">{translated.geometry}</p><h2>{translated.notAvailable}</h2><p>{translated.emptyDetail}</p></div>}</section>
    {calculatedArea && <section className="area-grid" aria-label={translated.calculatedArea}><article><p className="eyebrow">{translated.squareMeters}</p><strong>{format(calculatedArea.squareMeters, 2)} m²</strong></article><article><p className="eyebrow">{translated.hectares}</p><strong>{format(calculatedArea.hectares, 4)} ha</strong></article><article><p className="eyebrow">{translated.acres}</p><strong>{format(calculatedArea.acres, 4)} acre</strong></article></section>}
    <section className="parcel-comparison" aria-labelledby="area-comparison-title"><div className="section-head"><div><p className="eyebrow">{c.areaComparison}</p><h2 id="area-comparison-title">{c.areaComparison}</h2></div></div><div className="area-source-grid">{areaSources.map((source) => <AreaSourceCard key={source.sourceType} caseId={caseId} source={source} c={c} traceability={experience.traceability} />)}</div></section>
    <OfficialRecordContext caseId={caseId} /><EarthObservationTeaser caseId={caseId} /><aside className={`parcel-insight ${comparisonSummary.status.toLowerCase()}`} aria-labelledby="parcel-insight-title"><p className="eyebrow">{c.areaComparison}</p><h2 id="parcel-insight-title">{c.summary.title}</h2><p>{c.summary.detail}</p><dl>{areaSources.map((source) => <div key={source.sourceType}><dt>{sourceLabel(source, c)}</dt><dd>{source.normalizedAcres === null ? c.unavailable : `${format(source.normalizedAcres, 4)} acre`}</dd></div>)}</dl><Link className="button secondary" href={`/cases/${caseId}/documents`}>{c.evidence}</Link></aside>
    <section className="pairwise-comparisons" aria-labelledby="pairwise-comparisons-title"><p className="eyebrow">{c.comparisons}</p><h2 id="pairwise-comparisons-title">{c.comparisons}</h2><div className="comparison-list">{pairwiseComparisons.map((comparison) => { const left = areaSources.find((source) => source.sourceType === comparison.leftSource)!; const right = areaSources.find((source) => source.sourceType === comparison.rightSource)!; return <article className={`area-comparison-row ${comparison.status.toLowerCase()}`} key={`${comparison.leftSource}-${comparison.rightSource}`}><div><h3>{sourceLabel(left, c)} ↔ {sourceLabel(right, c)}</h3><p>{comparison.percentageDifference === null ? c.unavailable : `${format(comparison.percentageDifference, 1)}% ${c.difference}`}</p></div><strong>{statusLabel(comparison.status, c)}</strong></article>; })}</div></section>
    <details className="comparison-how"><summary>{c.how}</summary><p>{c.howDetail}</p><p className="micro">{comparisonPolicy.legalDisclaimer}</p></details>
  </div>;
}

export function ParcelIntelligenceTeaser({ caseId }: { caseId: string }) {
  const { locale } = useLocale();
  const [data, setData] = useState<ParcelIntelligence | null>(null);
  useEffect(() => { void fetch(`/api/cases/${encodeURIComponent(caseId)}/parcel-intelligence`).then((response) => response.ok ? response.json() as Promise<{ data: ParcelIntelligence }> : null).then((result) => setData(result?.data ?? null)).catch(() => setData(null)); }, [caseId]);
  const c = localizedParcelComparisonPresentation(locale);
  return <article className="summary-card"><p className="eyebrow">{c.areaComparison}</p><h2>{data?.geometry ? c.sourcesAvailable : c.noMappedBoundary}</h2><p>{data?.geometry ? `${c.historical} / ${c.survey} / ${c.geometry}` : c.unavailable}</p><Link className="compact-action" href={`/cases/${caseId}/parcel-intelligence`}>{c.areaComparison} →</Link></article>;
}
