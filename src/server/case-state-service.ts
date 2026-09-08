import type { CaseDetail, ReviewPacket, TimelineEvent } from "@/types/case";
const event = (id: string, title: string, detail: string, status: TimelineEvent["status"] = "done"): TimelineEvent => ({ id, dateLabel: "Current case state", title, detail, status });
export function buildTimeline(detail: CaseDetail, packets: ReviewPacket[]): TimelineEvent[] {
  const events = [...detail.timeline];
  const add = (item: TimelineEvent) => { if (!events.some((event) => event.id === item.id)) events.push(item); };
  if (detail.documents.length) add(event("documents-available", "Documents available", `${detail.documents.length} synthetic record${detail.documents.length === 1 ? " is" : "s are"} available.`));
  if (detail.documents.some((document) => document.state === "extracted")) add(event("structured-information", "Structured information available", "At least one synthetic record has prepared fields."));
  if (detail.verification.length) add(event("verification-completed", "Verification completed", "Deterministic checks are available to review."));
  if (detail.verification.some((item) => item.outcome === "POTENTIAL_ISSUE")) add(event("potential-discrepancy", "Potential discrepancy identified", "A record comparison needs citizen review."));
  if (detail.guidance?.length) add(event("guidance-available", "Guidance available", "Preparation guidance is available for the current record state."));
  packets.forEach((packet) => { add(event(`${packet.id}-created`, "Review packet created", "A synthetic review packet draft exists.")); if (packet.status === "READY_FOR_REVIEW") add(event(`${packet.id}-ready`, "Ready for review", "A packet is prepared for review and has not been submitted.")); });
  return events;
}
