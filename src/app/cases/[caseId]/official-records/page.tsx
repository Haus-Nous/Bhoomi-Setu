"use client";

import { useState } from "react";

import { CasePage } from "@/components/case-page";
import { useLocale } from "@/components/locale-context";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { TraceabilityDetails } from "@/components/traceability-details";
import {
  localizedOfficialRecordInspectionPresentation,
  localizedOfficialRecordPresentation,
} from "@/lib/i18n";
import type {
  CaseDetail,
  OfficialIdentityMatch,
  OfficialParcelRecord,
} from "@/types/case";

type MessageTone = "error" | "success" | "status";

function identityForCase(
  record: OfficialParcelRecord,
  detail: CaseDetail,
): OfficialIdentityMatch {
  const parcel = detail.landParcels[0];
  const normalize = (value: string) => value.trim().toLowerCase();
  const sameLocation =
    normalize(record.parcelIdentity.district) ===
      normalize(detail.case.location.district) &&
    normalize(record.parcelIdentity.circle) ===
      normalize(detail.case.location.circle) &&
    normalize(record.parcelIdentity.mauza) ===
      normalize(detail.case.location.village);

  if (
    !parcel ||
    !sameLocation ||
    normalize(record.parcelIdentity.khataNumber) !== normalize(parcel.khata) ||
    (parcel.khesra &&
      normalize(record.parcelIdentity.khesraNumber) !==
        normalize(parcel.khesra))
  ) {
    return "MISMATCH";
  }

  return parcel.khesra ? "EXACT_MATCH" : "PARTIAL_MATCH";
}

function OfficialRecordsContent({
  detail,
  caseId,
}: {
  detail: CaseDetail;
  caseId: string;
}) {
  const { locale } = useLocale();
  const copy = localizedOfficialRecordPresentation(locale);
  const labels = localizedOfficialRecordInspectionPresentation(locale);
  const parcel = detail.landParcels[0];
  const [results, setResults] = useState<OfficialParcelRecord[] | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("status");
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const showMessage = (next: string, tone: MessageTone = "status") => {
    setMessage(next);
    setMessageTone(tone);
  };

  const search = async (form: FormData) => {
    const district = String(form.get("district") ?? "").trim();
    const circle = String(form.get("circle") ?? "").trim();
    const mauza = String(form.get("mauza") ?? "").trim();
    const khataNumber = String(form.get("khataNumber") ?? "").trim();
    const khesraNumber = String(form.get("khesraNumber") ?? "").trim();

    if (!district || !circle || !mauza || (!khataNumber && !khesraNumber)) {
      setResults([]);
      showMessage(labels.validation, "error");
      return;
    }

    setLoading(true);
    setResults(null);
    showMessage("");

    try {
      const response = await fetch("/api/official-records/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = (await response.json()) as {
        results?: OfficialParcelRecord[];
      };

      if (!response.ok) {
        setResults([]);
        showMessage(labels.validation, "error");
        return;
      }

      const matches = data.results ?? [];
      setResults(matches);
      if (matches.length === 0) {
        showMessage(copy.noMatch);
      } else if (matches.length > 1) {
        showMessage(copy.multiple);
      } else {
        showMessage(labels.searchResults);
      }
    } catch {
      setResults([]);
      showMessage(labels.serverError, "error");
    } finally {
      setLoading(false);
    }
  };

  const importRecord = async (officialRecordId: string) => {
    setImportingId(officialRecordId);
    showMessage("");

    try {
      const response = await fetch(
        `/api/cases/${caseId}/official-records/import`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ officialRecordId }),
        },
      );
      const data = (await response.json()) as {
        alreadyImported?: boolean;
      };

      if (response.status === 409) {
        showMessage(copy.mismatch, "error");
      } else if (!response.ok) {
        showMessage(labels.importError, "error");
      } else if (data.alreadyImported) {
        showMessage(copy.linked, "status");
      } else {
        showMessage(copy.added, "success");
      }
    } catch {
      showMessage(labels.importError, "error");
    } finally {
      setImportingId(null);
    }
  };

  const fields = [
    {
      name: "district",
      label: labels.district,
      value: detail.case.location.district,
      required: true,
    },
    {
      name: "circle",
      label: labels.circle,
      value: detail.case.location.circle,
      required: true,
    },
    {
      name: "mauza",
      label: labels.mauza,
      value: detail.case.location.village,
      required: true,
    },
    {
      name: "khataNumber",
      label: labels.khata,
      value: parcel?.khata ?? "",
      required: false,
    },
    {
      name: "khesraNumber",
      label: labels.khesra,
      value: parcel?.khesra ?? "",
      required: false,
    },
  ];

  return (
    <main id="main" className="case-layout">
      <CaseNavigation caseId={caseId} />
      <div className="case-content">
        <CaseHeader title={copy.title} subtitle={copy.subtitle} />

        <form className="form-card" action={search}>
          <fieldset aria-describedby="official-search-note">
            <legend>{copy.search}</legend>
            <p id="official-search-note" className="micro">
              {copy.subtitle}
            </p>
            {fields.map((field) => (
              <label key={field.name} htmlFor={`official-${field.name}`}>
                {field.label}
                <input
                  id={`official-${field.name}`}
                  name={field.name}
                  defaultValue={field.value}
                  aria-required={field.required || undefined}
                />
              </label>
            ))}
          </fieldset>
          <button className="button" disabled={loading} type="submit">
            {loading ? copy.loading : copy.search}
          </button>
        </form>

        {message && (
          <p
            className={messageTone === "error" ? "form-error" : "callout"}
            role={messageTone === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message}
          </p>
        )}

        {results && results.length > 1 && (
          <section aria-labelledby="multiple-records-title">
            <div className="section-head">
              <div>
                <p className="eyebrow">{copy.synthetic}</p>
                <h2 id="multiple-records-title">{copy.multiple}</h2>
              </div>
            </div>
          </section>
        )}

        {results?.map((record) => {
          const identity = identityForCase(record, detail);
          const identityLabel =
            identity === "EXACT_MATCH"
              ? labels.exact
              : identity === "PARTIAL_MATCH"
                ? labels.partial
                : copy.mismatch;
          const isImporting = importingId === record.id;

          return (
            <article className="survey-card" key={record.id}>
              <p className="eyebrow">{copy.synthetic}</p>
              <h2>{record.sourceMetadata.displayName}</h2>
              <p>{labels.notLive}</p>
              <p className="micro">
                <strong>{labels.notAuthoritative}</strong>
              </p>

              <dl>
                <div>
                  <dt>{labels.district}</dt>
                  <dd>{record.parcelIdentity.district}</dd>
                </div>
                <div>
                  <dt>{labels.circle}</dt>
                  <dd>{record.parcelIdentity.circle}</dd>
                </div>
                <div>
                  <dt>{labels.mauza}</dt>
                  <dd>{record.parcelIdentity.mauza}</dd>
                </div>
                <div>
                  <dt>{labels.khata}</dt>
                  <dd>{record.parcelIdentity.khataNumber}</dd>
                </div>
                <div>
                  <dt>{labels.khesra}</dt>
                  <dd>{record.parcelIdentity.khesraNumber}</dd>
                </div>
                <div>
                  <dt>{copy.area}</dt>
                  <dd>
                    {record.recordData.recordedArea.toFixed(2)}{" "}
                    {record.recordData.recordedAreaUnit}
                  </dd>
                </div>
                <div>
                  <dt>{labels.holders}</dt>
                  <dd>{record.recordData.holderNames.join(", ")}</dd>
                </div>
                <div>
                  <dt>{labels.recordType}</dt>
                  <dd>{record.recordData.recordType}</dd>
                </div>
                <div>
                  <dt>{labels.surveyStage}</dt>
                  <dd>{record.recordData.surveyStage}</dd>
                </div>
                <div>
                  <dt>{labels.remarks}</dt>
                  <dd>{record.recordData.remarks}</dd>
                </div>
                <div>
                  <dt>{labels.identity}</dt>
                  <dd>{identityLabel}</dd>
                </div>
                <div>
                  <dt>{labels.authority}</dt>
                  <dd>{labels.notAuthoritative}</dd>
                </div>
              </dl>

              <TraceabilityDetails summary={labels.traceability}>
                <dl className="traceability-list">
                  <div><dt>{copy.provider}</dt><dd>{record.sourceProvider}</dd></div>
                  <div><dt>{copy.provenance}</dt><dd>{record.provenance}</dd></div>
                  <div><dt>{labels.source}</dt><dd>{record.sourceReference}</dd></div>
                </dl>
              </TraceabilityDetails>

              <aside className="callout">
                <strong>{copy.synthetic}</strong>
                <p>{labels.importSafety}</p>
              </aside>
              <button
                className="button"
                type="button"
                disabled={isImporting || identity === "MISMATCH"}
                onClick={() => void importRecord(record.id)}
              >
                {isImporting ? labels.adding : copy.import}
              </button>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default function OfficialRecordsPage() {
  return (
    <CasePage>
      {(detail, caseId) => (
        <OfficialRecordsContent detail={detail} caseId={caseId} />
      )}
    </CasePage>
  );
}
