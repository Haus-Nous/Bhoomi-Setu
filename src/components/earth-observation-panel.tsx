"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, LoadingState } from "@/components/domain";
import { useLocale } from "@/components/locale-context";
import { TraceabilityDetails } from "@/components/traceability-details";
import { localizedEarthObservationPresentation } from "@/lib/i18n";
import type { EarthObservationClassification, EarthObservationIndicator, EarthObservationInsight, ImagerySnapshot } from "@/types/earth-observation";

const statusClass = (status: EarthObservationClassification) => status.toLowerCase();

function ContextImage({ snapshot, label, syntheticLabel }: { snapshot: ImagerySnapshot; label: string; syntheticLabel: string }) {
  const isBuiltUp = snapshot.visualVariant === "MODEST_BUILT_UP";
  const stable = snapshot.visualVariant === "STABLE_OPEN";
  const laterStable = stable && snapshot.id.endsWith("2025");
  const greens = isBuiltUp ? ["#78996f", "#96ad7b", "#6c8b69"] : stable ? laterStable ? ["#739a78", "#86a87f", "#6c9072"] : ["#719b76", "#82a77d", "#6d9274"] : ["#4f8e70", "#72ad7a", "#5f9d6b"];
  return <figure className="context-image">
    <svg viewBox="0 0 480 260" role="img" aria-label={`${syntheticLabel}: ${label}`}>
      <rect width="480" height="260" fill="#d7dfbf" />
      <path d="M0 28 130 0l70 72L318 24l162 60v176H0Z" fill={greens[0]} />
      <path d="M0 174 164 90l114 56 202-62v176H0Z" fill={greens[1]} opacity=".86" />
      <path d="m20 224 182-148 78 54 174-74" fill="none" stroke="#d4c188" strokeWidth="17" opacity=".82" />
      <path d="m20 224 182-148 78 54 174-74" fill="none" stroke="#f4e5af" strokeWidth="5" opacity=".8" />
      {isBuiltUp && <g fill="#6c706a" stroke="#f1eee3" strokeWidth="2"><rect x="260" y="44" width="62" height="41" rx="3" /><rect x="337" y="75" width="47" height="52" rx="3" /><rect x="284" y="151" width="65" height="43" rx="3" /><rect x="382" y="157" width="53" height="38" rx="3" /></g>}
      {!isBuiltUp && <g fill={greens[2]} opacity=".9" transform={laterStable ? "translate(7 -3)" : undefined}><circle cx="298" cy="61" r={laterStable ? "22" : "24"} /><circle cx="365" cy="103" r="29" /><circle cx="313" cy="170" r={laterStable ? "29" : "31"} /><circle cx="419" cy="178" r="27" /></g>}
      <rect x="12" y="12" width="226" height="31" rx="5" fill="rgba(24,44,42,.84)" />
      <text x="25" y="33" fill="#fffefa" fontSize="14" fontWeight="700">{syntheticLabel}</text>
    </svg>
    <figcaption><strong>{label}</strong><span>{snapshot.observationDate}</span></figcaption>
  </figure>;
}

function IndicatorCard({ item }: { item: EarthObservationIndicator }) {
  const { locale } = useLocale();
  const c = localizedEarthObservationPresentation(locale);
  const name = item.type === "VEGETATION_CHANGE" ? c.vegetation : item.type === "BUILT_UP_CHANGE" ? c.builtUp : item.type === "SURFACE_CHANGE" ? c.surface : c.water;
  const label = item.classification === "STABLE" ? c.stable : item.classification === "SMALL_CHANGE" ? c.small : item.classification === "NOTICEABLE_CHANGE" ? c.noticeable : c.insufficient;
  const explanation = item.explanationKey === "VEGETATION" ? c.explanationVegetation : item.explanationKey === "BUILT_UP" ? c.explanationBuiltUp : c.explanationInsufficient;
  const percentage = (value: number | null) => value === null ? "—" : `${value}%`;
  const delta = item.deltaPercentagePoints === null ? "—" : `${item.deltaPercentagePoints > 0 ? "+" : ""}${item.deltaPercentagePoints} pp`;
  return <article className={`earth-indicator ${statusClass(item.classification)}`}><div className="earth-indicator-head"><h3>{name}</h3><span className="earth-status">{label}</span></div><dl><div><dt>{c.earlierValue}</dt><dd>{percentage(item.earlierValue)}</dd></div><div><dt>{c.laterValue}</dt><dd>{percentage(item.laterValue)}</dd></div><div><dt>{c.change}</dt><dd>{delta}</dd></div></dl><p>{explanation}</p></article>;
}

function EarthObservationContent({ insight, caseId }: { insight: EarthObservationInsight; caseId: string }) {
  const { locale } = useLocale();
  const c = localizedEarthObservationPresentation(locale);
  const isInsufficient = insight.overallClassification === "INSUFFICIENT_EVIDENCE";
  const summary = isInsufficient ? c.insufficientSummary : insight.overallClassification === "NOTICEABLE_CHANGE" ? c.heroSummary : c.controlSummary;
  const [earlier, later] = insight.snapshots;
  return <div className="earth-observation">
    <aside className="earth-safety" aria-labelledby="earth-safety-title"><strong id="earth-safety-title">{c.safetyTitle}</strong><p>{c.safetyDetail}</p></aside>
    {isInsufficient ? <EmptyState title={c.unavailableTitle} detail={c.unavailableDetail} /> : <>
      <section aria-label={c.synthetic}><div className="earth-snapshot-grid"><ContextImage snapshot={earlier!} label={c.earlier} syntheticLabel={c.synthetic} /><ContextImage snapshot={later!} label={c.later} syntheticLabel={c.synthetic} /></div></section>
      <TraceabilityDetails summary={c.traceability} className="earth-metadata"><dl><div><dt>{c.provider}</dt><dd>{insight.provider}</dd></div><div><dt>{c.provenance}</dt><dd>{insight.provenance}</dd></div><div><dt>{c.quality}</dt><dd>{earlier?.quality}</dd></div><div><dt>{c.source}</dt><dd>{earlier?.assetReference} · {later?.assetReference}</dd></div></dl><p>{c.traceabilityDetail}</p><p className="micro">{insight.policy.id} · ±{insight.policy.stableThresholdPercentagePoints} pp {c.stable} · &gt;{insight.policy.noticeableThresholdPercentagePoints} pp {c.noticeable}</p></TraceabilityDetails>
    </>}
    <section aria-labelledby="earth-indicators-title"><p className="eyebrow">{c.indicators}</p><h2 id="earth-indicators-title">{c.indicators}</h2><div className="earth-indicator-grid">{insight.indicators.map((item) => <IndicatorCard item={item} key={item.type} />)}</div></section>
    <aside className={`earth-summary ${statusClass(insight.overallClassification)}`} aria-labelledby="earth-summary-title"><p className="eyebrow">{c.overall}</p><h2 id="earth-summary-title">{insight.overallClassification === "STABLE" ? c.stable : insight.overallClassification === "SMALL_CHANGE" ? c.small : insight.overallClassification === "NOTICEABLE_CHANGE" ? c.noticeable : c.insufficient}</h2><p>{summary}</p></aside>
    <Link className="button secondary" href={`/cases/${caseId}/parcel-intelligence`}>{c.back}</Link>
  </div>;
}

export function EarthObservationPanel({ caseId }: { caseId: string }) {
  const { locale } = useLocale();
  const c = localizedEarthObservationPresentation(locale);
  const [state, setState] = useState<{ data: EarthObservationInsight | null; error: boolean }>({ data: null, error: false });
  useEffect(() => { const controller = new AbortController(); void fetch(`/api/cases/${encodeURIComponent(caseId)}/earth-observation`, { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<{ data: EarthObservationInsight }> : Promise.reject()).then(({ data }) => setState({ data, error: false })).catch(() => { if (!controller.signal.aborted) setState({ data: null, error: true }); }); return () => controller.abort(); }, [caseId]);
  if (state.error) return <EmptyState title={c.unavailableTitle} detail={c.error} />;
  if (!state.data) return <LoadingState />;
  return <EarthObservationContent insight={state.data} caseId={caseId} />;
}

export function EarthObservationTeaser({ caseId, compact = false }: { caseId: string; compact?: boolean }) {
  const { locale } = useLocale();
  const c = localizedEarthObservationPresentation(locale);
  return <section className={`earth-teaser ${compact ? "compact" : ""}`} aria-labelledby="earth-teaser-title"><div><p className="eyebrow">{c.synthetic}</p><h2 id="earth-teaser-title">{c.teaserTitle}</h2><p>{c.teaserDetail}</p></div><Link className={compact ? "compact-action" : "button secondary"} href={`/cases/${caseId}/earth-observation`}>{c.view} {compact && <span aria-hidden>→</span>}</Link></section>;
}
