"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { PublicAnchorVerification } from "@/types/anchor";

export default function VerifierPage({ params }: { params: Promise<{ anchorId: string }> }) {
  const { anchorId } = use(params);
  const [data, setData] = useState<PublicAnchorVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchVerification() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/anchors/${encodeURIComponent(anchorId)}/verify`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Anchor record not found. This anchor ID does not exist in the integrity log.");
          }
          throw new Error("Unable to complete verification at this time.");
        }
        const json = (await response.json()) as { data: PublicAnchorVerification };
        if (active) {
          setData(json.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load verification record.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void fetchVerification();
    return () => {
      active = false;
    };
  }, [anchorId]);

  return (
    <main id="main" className="public-verifier-layout">
      <div className="verifier-container">
        <header className="verifier-header">
          <p className="eyebrow">Cryptographic Trust Layer</p>
          <h1>Record Integrity Verification</h1>
          <p className="micro">
            Public verification of signed verification results via an append-only, hash-chained integrity log.
          </p>
        </header>

        {loading && (
          <div className="verifier-loading" role="status">
            <p>Recomputing cryptographic hash and verifying against anchor record...</p>
          </div>
        )}

        {error && (
          <div className="verifier-alert alert-error" role="alert">
            <h2>Verification Unavailable</h2>
            <p>{error}</p>
            <p className="micro">Anchor ID: <code>{anchorId}</code></p>
            <Link className="button secondary small" href="/">
              Return to Home
            </Link>
          </div>
        )}

        {data && (
          <div className="verifier-result">
            {data.matches ? (
              <div className="verifier-status-banner banner-match" role="status" aria-label="Integrity Verified">
                <div className="banner-icon" aria-hidden>✓</div>
                <div className="banner-content">
                  <h2>INTEGRITY VERIFIED: MATCH</h2>
                  <p>The record payload exactly matches the cryptographic signature recorded when it was signed.</p>
                </div>
              </div>
            ) : (
              <div className="verifier-status-banner banner-mismatch" role="alert" aria-label="Integrity Alert: Mismatch">
                <div className="banner-icon" aria-hidden>⚠</div>
                <div className="banner-content">
                  <h2>INTEGRITY ALERT: MISMATCH</h2>
                  <p>This record has been modified or tampered with since it was signed.</p>
                </div>
              </div>
            )}

            <div className="verifier-details-card">
              <h3>Cryptographic Audit Details</h3>
              <dl className="verifier-meta-grid">
                <div>
                  <dt>Anchor Identifier</dt>
                  <dd><code>{anchorId}</code></dd>
                </div>
                <div>
                  <dt>Case Reference</dt>
                  <dd>{data.caseReference}</dd>
                </div>
                <div>
                  <dt>Signing Authority</dt>
                  <dd>{data.signedBy}</dd>
                </div>
                <div>
                  <dt>Signed Timestamp (UTC)</dt>
                  <dd>{new Date(data.signedAt).toUTCString()}</dd>
                </div>
              </dl>

              <div className="hash-comparison-section">
                <h4>Hash Verification Comparison</h4>
                <div className="hash-box">
                  <div className="hash-label">
                    <span>Stored Anchor Hash (SHA-256)</span>
                  </div>
                  <code className="hash-value">{data.storedHash}</code>
                </div>
                <div className={`hash-box ${data.matches ? "hash-match" : "hash-mismatch"}`}>
                  <div className="hash-label">
                    <span>Current Recomputed Hash (from live record)</span>
                    {data.matches ? (
                      <span className="match-tag match-tag-ok">Matches Stored</span>
                    ) : (
                      <span className="match-tag match-tag-bad">Mismatch Detected</span>
                    )}
                  </div>
                  <code className="hash-value">{data.recomputedHash ?? "RECORD DELETED OR MISSING"}</code>
                </div>
              </div>
            </div>

            <aside className="callout verifier-disclaimer">
              <strong>Important Notice & Disclaimer</strong>
              <p>
                This proves the record has not changed since signing. It does not prove ownership and is not a government record.
              </p>
              <p className="micro">
                Bhoomi Setu provides an independent, synthetic integrity-verification log for demonstration of tamper-evidence. It does not replace official state land records or legal title deeds.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
