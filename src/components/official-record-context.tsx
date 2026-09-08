"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale } from "@/components/locale-context";
import { TraceabilityDetails } from "@/components/traceability-details";
import {
  localizedOfficialRecordDocumentsPresentation,
  localizedOfficialRecordPresentation,
} from "@/lib/i18n";
import type { ImportedOfficialRecord } from "@/types/case";

type OfficialRecordContextVariant = "default" | "documents";

export function importedRecordDocumentSummary(item: ImportedOfficialRecord) {
  return {
    khata: item.record.parcelIdentity.khataNumber,
    khesra: item.record.parcelIdentity.khesraNumber,
    recordedArea: `${item.record.recordData.recordedArea.toFixed(2)} ${item.record.recordData.recordedAreaUnit}`,
    source: `${item.record.sourceMetadata.displayName} · ${item.sourceReference}`,
    provenance: item.provenance,
    identityMatch: item.identityMatch,
  };
}

export function DocumentImportedRecords({
  caseId,
  items,
  status,
}: {
  caseId: string;
  items: ImportedOfficialRecord[] | null;
  status: "loading" | "error" | "ready";
}) {
  const { locale } = useLocale();
  const copy = localizedOfficialRecordPresentation(locale);
  const documents = localizedOfficialRecordDocumentsPresentation(locale);

  return (
    <section className="imported-records" aria-labelledby="imported-records-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">{copy.synthetic}</p>
          <h2 id="imported-records-title">{documents.title}</h2>
        </div>
      </div>

      {status === "loading" && (
        <p className="micro" role="status" aria-live="polite">
          {documents.loading}
        </p>
      )}

      {status === "error" && (
        <p className="form-error" role="alert">
          {documents.unavailable}
        </p>
      )}

      {status === "ready" && !items?.length && (
        <div className="imported-records-empty">
          <p>{copy.none}</p>
          <Link className="button secondary" href={`/cases/${caseId}/official-records`}>
            {copy.lookup}
          </Link>
        </div>
      )}

      {items?.map((item) => {
        const summary = importedRecordDocumentSummary(item);
        return (
          <article className="imported-record-card" key={item.id}>
            <p className="eyebrow">{copy.synthetic}</p>
            <h3>{item.record.sourceMetadata.displayName}</h3>
            <p className="micro">
              <strong>{documents.notAuthoritative}</strong>
            </p>
            <dl>
              <div>
                <dt>Khata</dt>
                <dd>{summary.khata}</dd>
              </div>
              <div>
                <dt>Khesra</dt>
                <dd>{summary.khesra}</dd>
              </div>
              <div>
                <dt>{copy.area}</dt>
                <dd>{summary.recordedArea}</dd>
              </div>
              <div>
                <dt>{documents.identity}</dt>
                <dd>{summary.identityMatch}</dd>
              </div>
            </dl>
            <TraceabilityDetails summary={documents.traceability}>
              <dl className="traceability-list"><div><dt>{copy.provider}</dt><dd>{item.provider}</dd></div><div><dt>{copy.provenance}</dt><dd>{summary.provenance}</dd></div><div><dt>{documents.source}</dt><dd>{summary.source}</dd></div></dl>
            </TraceabilityDetails>
            <Link className="button secondary" href={`/cases/${caseId}/official-records`}>
              {documents.view}
            </Link>
          </article>
        );
      })}
    </section>
  );
}

export function OfficialRecordContext({
  caseId,
  compact = false,
  variant = "default",
}: {
  caseId: string;
  compact?: boolean;
  variant?: OfficialRecordContextVariant;
}) {
  const { locale } = useLocale();
  const copy = localizedOfficialRecordPresentation(locale);
  const [items, setItems] = useState<ImportedOfficialRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`/api/cases/${caseId}/official-records/import`)
      .then((response) => {
        if (!response.ok) throw new Error("Official record context unavailable");
        return response.json() as Promise<{ data: ImportedOfficialRecord[] }>;
      })
      .then((result) => {
        if (active) {
          setFailed(false);
          setItems(result.data);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
          setItems([]);
        }
      });

    return () => {
      active = false;
    };
  }, [caseId]);

  if (variant === "documents") {
    return (
      <DocumentImportedRecords
        caseId={caseId}
        items={items}
        status={items === null ? "loading" : failed ? "error" : "ready"}
      />
    );
  }

  if (items === null) return null;
  const item = items[0];

  return (
    <section className={compact ? "summary-card" : "survey-card"}>
      <p className="eyebrow">{copy.context}</p>
      {!item ? (
        <>
          <h2>{copy.none}</h2>
          <Link className="compact-action" href={`/cases/${caseId}/official-records`}>
            {copy.lookup} →
          </Link>
        </>
      ) : (
        <>
          <h2>{copy.synthetic}</h2>
          <dl>
            <div>
              <dt>Khata / Khesra</dt>
              <dd>
                {item.record.parcelIdentity.khataNumber} /{" "}
                {item.record.parcelIdentity.khesraNumber}
              </dd>
            </div>
            <div>
              <dt>{copy.area}</dt>
              <dd>
                {item.record.recordData.recordedArea.toFixed(2)}{" "}
                {item.record.recordData.recordedAreaUnit}
              </dd>
            </div>
          </dl>
          <TraceabilityDetails summary={copy.traceability}><p className="micro"><strong>{copy.provenance}:</strong> {item.provenance} · {item.sourceReference}</p></TraceabilityDetails>
          <Link className="compact-action" href={`/cases/${caseId}/official-records`}>
            {copy.lookup} →
          </Link>
        </>
      )}
    </section>
  );
}
