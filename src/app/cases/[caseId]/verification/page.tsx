"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CasePage } from "@/components/case-page";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import { EmptyState, VerificationDiscrepancyCard, VerificationIssue, VerificationSummary } from "@/components/domain";
import { useTranslation } from "@/components/locale-context";
import { useLocale } from "@/components/locale-context";
import { localizedParcelComparisonPresentation } from "@/lib/i18n";
import type { CaseDetail } from "@/types/case";
import type { AnchorEvent } from "@/types/anchor";

function VerificationContent({ detail, caseId }: { detail: CaseDetail; caseId: string }) {
  const c = useTranslation().verification;
  const { locale } = useLocale();
  const parcel = localizedParcelComparisonPresentation(locale);

  const [anchors, setAnchors] = useState<Record<string, AnchorEvent>>({});
  const [anchoring, setAnchoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAnchors() {
      try {
        const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/anchors`);
        if (!response.ok) return;
        const body = (await response.json()) as { data: AnchorEvent[] };
        if (active && Array.isArray(body.data)) {
          const map: Record<string, AnchorEvent> = {};
          for (const a of body.data) {
            map[a.subject_id] = a;
          }
          setAnchors(map);
        }
      } catch {
        // Non-critical background fetch failure
      }
    }
    void loadAnchors();
    return () => {
      active = false;
    };
  }, [caseId]);

  const handleAnchor = async (resultId: string) => {
    setAnchoring(resultId);
    setError(null);
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/anchors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });
      if (!response.ok) throw new Error("Could not anchor verification result.");
      const body = (await response.json()) as { data: AnchorEvent };
      setAnchors((prev) => ({ ...prev, [resultId]: body.data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to anchor.");
    } finally {
      setAnchoring(null);
    }
  };

  const potentialIssues = detail.verification.filter((item) => item.outcome === "POTENTIAL_ISSUE");

  return (
    <main id="main" className="case-layout">
      <CaseNavigation caseId={caseId} />
      <div className="case-content">
        <CaseHeader title={c.pageTitle} subtitle={c.pageSubtitle} />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {detail.verification.length ? (
          <>
            <VerificationSummary items={detail.verification} />

            {potentialIssues.length > 0 && (
              <section className="discrepancy-list" aria-labelledby="potential-discrepancies">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">{c.potentialIssue}</p>
                    <h2 id="potential-discrepancies">{c.reviewDifferences}</h2>
                  </div>
                </div>
                {potentialIssues.map((item) => {
                  const anchor = anchors[item.id];
                  return (
                    <div key={item.id} className="discrepancy-card-wrapper">
                      <VerificationDiscrepancyCard item={item} documents={detail.documents} />
                      <div className="anchor-action-bar">
                        {anchor ? (
                          <div className="anchor-status-box">
                            <span className="anchor-badge">⚓ Anchored</span>
                            <span className="anchor-id">ID: <code>{anchor.id}</code></span>
                            <Link
                              className="anchor-verify-link"
                              href={`/verify/${anchor.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Verify integrity (Public page) ↗
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button secondary small"
                            disabled={anchoring === item.id}
                            onClick={() => void handleAnchor(item.id)}
                          >
                            {anchoring === item.id ? "Anchoring..." : "Anchor this result"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            <section className="all-checks" aria-labelledby="all-checks-title">
              <div className="section-head">
                <div>
                  <p className="eyebrow">{c.allChecks}</p>
                  <h2 id="all-checks-title">{c.allChecksTitle}</h2>
                </div>
              </div>
              <div className="issue-list">
                {detail.verification.map((item) => {
                  const anchor = anchors[item.id];
                  return (
                    <div key={item.id} className="issue-item-wrapper">
                      <VerificationIssue item={item} />
                      <div className="anchor-action-bar">
                        {anchor ? (
                          <div className="anchor-status-box">
                            <span className="anchor-badge">⚓ Anchored</span>
                            <span className="anchor-id">ID: <code>{anchor.id}</code></span>
                            <Link
                              className="anchor-verify-link"
                              href={`/verify/${anchor.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Verify integrity (Public page) ↗
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="button secondary small"
                            disabled={anchoring === item.id}
                            onClick={() => void handleAnchor(item.id)}
                          >
                            {anchoring === item.id ? "Anchoring..." : "Anchor this result"}
                          </button>
                        )}
                      </div>
                      {item.ruleId === "AREA_CONSISTENCY" && (
                        <Link className="compact-action" href={`/cases/${caseId}/parcel-intelligence`}>
                          {parcel.areaComparison} <span aria-hidden>→</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <EmptyState title={c.noResultsTitle} detail={c.noResultsDetail} />
        )}

        <aside className="callout verification-page-caution">
          <strong>{c.caution}</strong>
          <p>{c.cautionDetail}</p>
        </aside>
      </div>
    </main>
  );
}

export default function VerificationPage() {
  return (
    <CasePage>
      {(detail, caseId) => <VerificationContent detail={detail} caseId={caseId} />}
    </CasePage>
  );
}
