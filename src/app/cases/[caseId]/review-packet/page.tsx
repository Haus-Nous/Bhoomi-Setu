"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CasePage } from "@/components/case-page";
import { CaseHeader, CaseNavigation } from "@/components/shell";
import type { ReviewPacket } from "@/types/case";
import { useLocale, useTranslation } from "@/components/locale-context";
import { localizedPacketPresentation } from "@/lib/i18n";

function PacketContent({ caseId, packetId, resultId }: { caseId: string; packetId: string | null; resultId: string | null }) {
  const c = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const [packet, setPacket] = useState<ReviewPacket | null>(null);
  const [notes, setNotes] = useState("");
  const [request, setRequest] = useState("");
  const [message, setMessage] = useState("");

  const applyPacket = (value: ReviewPacket) => {
    setPacket(value);
    setNotes(value.citizenNotes);
    setRequest(value.requestedReviewText);
  };

  useEffect(() => {
    if (packetId) {
      void fetch(`/api/cases/${encodeURIComponent(caseId)}/review-packets/${encodeURIComponent(packetId)}`).then(async (response) => {
        const body = await response.json() as { data?: ReviewPacket };
        if (!response.ok || !body.data) throw new Error("packet unavailable");
        applyPacket(body.data);
      }).catch(() => setMessage(c.packet.failed));
      return;
    }
    if (!resultId) return;
    void fetch(`/api/cases/${encodeURIComponent(caseId)}/review-packets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationResultId: resultId })
    }).then(async (response) => {
      const body = await response.json() as { data?: ReviewPacket };
      if (!response.ok || !body.data) throw new Error("packet unavailable");
      applyPacket(body.data);
      router.replace(`/cases/${encodeURIComponent(caseId)}/review-packet?packet=${encodeURIComponent(body.data.id)}`);
    }).catch(() => setMessage(c.packet.failed));
  }, [caseId, packetId, resultId, router, c.packet.failed]);

  const save = async (ready = false) => {
    if (!packet) return;
    const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/review-packets/${encodeURIComponent(packet.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citizenNotes: notes, requestedReviewText: request, ...(ready ? { status: "READY_FOR_REVIEW" } : {}) })
    });
    const body = await response.json() as { data?: ReviewPacket };
    if (response.ok && body.data) {
      applyPacket(body.data);
      setMessage(ready ? c.packet.preparedMessage : c.packet.savedMessage);
      return;
    }
    setMessage(c.packet.failed);
  };

  const presentation = packet ? localizedPacketPresentation(locale, packet.issueCategory) : null;
  const displayedRequest = packet && request === packet.requestedReviewText ? presentation?.request || request : request;

  return <main id="main" className="case-layout"><CaseNavigation caseId={caseId} /><div className="case-content"><CaseHeader title={c.packet.header} subtitle={c.packet.subtitle} />{message && <p className="callout" role="status">{message}</p>}{packet && presentation ? <section className="guidance-item"><p className="eyebrow">{packet.status === "READY_FOR_REVIEW" ? c.packet.prepared : c.packet.draft}</p><h2>{packet.issueCategory.replace(/_/g, " ")}</h2><p>{presentation.summary}</p><p className="micro"><strong>{c.packet.compared}:</strong> {packet.comparedValues.expected || c.labels.notAvailable} / {packet.comparedValues.observed || c.labels.notAvailable}</p>{packet.status === "READY_FOR_REVIEW" && <p id="packet-locked" className="micro">{c.packet.preparedMessage}</p>}<p className="micro"><strong>{c.packet.supporting}:</strong> {packet.supportingDocumentIds.join(", ") || c.labels.notAvailable}</p><label className="packet-field">{c.packet.notes}<textarea value={notes} disabled={packet.status === "READY_FOR_REVIEW"} aria-describedby={packet.status === "READY_FOR_REVIEW" ? "packet-locked" : undefined} onChange={(event) => setNotes(event.target.value)} /></label><label className="packet-field">{c.packet.request}<textarea value={displayedRequest} disabled={packet.status === "READY_FOR_REVIEW"} aria-describedby={packet.status === "READY_FOR_REVIEW" ? "packet-locked" : undefined} onChange={(event) => setRequest(event.target.value)} /></label>{packet.status === "DRAFT" && <div className="actions"><button className="button secondary" onClick={() => void save()}>{c.cta.save}</button><button className="button" onClick={() => void save(true)}>{c.cta.readyForReview}</button></div>}<aside className="guidance-caution"><strong>{c.packet.safetyTitle}</strong><p>{c.packet.safetyDetail}</p></aside></section> : <p className="state">{packetId || resultId ? c.packet.preparing : c.packet.noPacketDetail}</p>}</div></main>;
}

export default function ReviewPacketPage() {
  const params = useSearchParams();
  const packetId = params.get("packet");
  const resultId = packetId ? null : params.get("result");
  return <CasePage>{(_, caseId) => <PacketContent key={packetId || resultId || "empty"} caseId={caseId} packetId={packetId} resultId={resultId} />}</CasePage>;
}
