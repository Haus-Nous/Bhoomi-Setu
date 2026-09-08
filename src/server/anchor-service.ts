import { createHash, randomUUID } from "node:crypto";
import { getDatabase } from "@/server/database";
import type { AnchorEvent, PublicAnchorVerification } from "@/types/anchor";

export class AnchorNotFoundError extends Error {}
export class VerificationResultNotFoundError extends Error {}

/**
 * Deterministically serializes a JSON-compatible value by recursively sorting object keys lexicographically.
 * Ensures consistent SHA-256 computation regardless of key insertion order.
 */
export function canonicalSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalSerialize(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs = keys
    .filter((key) => obj[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalSerialize(obj[key])}`);
  return `{${pairs.join(",")}}`;
}

/**
 * Computes the SHA-256 hash of a payload using canonical serialization.
 */
export function computePayloadHash(payload: unknown): string {
  const canonical = canonicalSerialize(payload);
  return createHash("sha256").update(canonical).digest("hex");
}

export class AnchorService {
  private async ready() {
    const database = getDatabase();
    await database.initialize();
    return database;
  }

  /**
   * Creates an append-only anchor record for a verification result.
   * If an anchor already exists for (caseId, "verification_result", resultId), returns the existing anchor.
   */
  async anchorVerificationResult(caseId: string, resultId: string, signedBy?: string): Promise<AnchorEvent> {
    const database = await this.ready();

    // Idempotency: return existing anchor if already anchored
    const existing = await database.query<AnchorEvent>({
      sql: "SELECT id, case_id, subject_type, subject_id, payload_hash, prev_hash, signed_by, signed_at FROM anchor_events WHERE case_id = ? AND subject_type = ? AND subject_id = ?",
      params: [caseId, "verification_result", resultId],
    });
    if (existing[0]) {
      return existing[0];
    }

    // Verify that the result exists
    const results = await database.query<{ payload: string }>({
      sql: "SELECT payload FROM verification_results WHERE case_id = ? AND id = ?",
      params: [caseId, resultId],
    });
    if (!results[0]) {
      throw new VerificationResultNotFoundError(`Verification result not found: ${resultId} in case ${caseId}`);
    }

    // Canonical hash of the verification result payload
    const parsed = JSON.parse(results[0].payload);
    const payloadHash = computePayloadHash(parsed);

    // Chain to previous anchor for this case
    const prevRows = await database.query<{ payload_hash: string }>({
      sql: "SELECT payload_hash FROM anchor_events WHERE case_id = ? ORDER BY signed_at DESC, id DESC LIMIT 1",
      params: [caseId],
    });
    const prevHash = prevRows[0]?.payload_hash ?? null;

    const id = `anc_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const signer = signedBy && signedBy.trim() ? signedBy.trim() : "Demo Verification Officer";
    const signedAt = new Date().toISOString();

    const anchor: AnchorEvent = {
      id,
      case_id: caseId,
      subject_type: "verification_result",
      subject_id: resultId,
      payload_hash: payloadHash,
      prev_hash: prevHash,
      signed_by: signer,
      signed_at: signedAt,
    };

    await database.execute({
      sql: "INSERT INTO anchor_events (id, case_id, subject_type, subject_id, payload_hash, prev_hash, signed_by, signed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: [
        anchor.id,
        anchor.case_id,
        anchor.subject_type,
        anchor.subject_id,
        anchor.payload_hash,
        anchor.prev_hash,
        anchor.signed_by,
        anchor.signed_at,
      ],
    });

    return anchor;
  }

  async listAnchors(caseId: string): Promise<AnchorEvent[]> {
    const database = await this.ready();
    return database.query<AnchorEvent>({
      sql: "SELECT id, case_id, subject_type, subject_id, payload_hash, prev_hash, signed_by, signed_at FROM anchor_events WHERE case_id = ? ORDER BY signed_at ASC, id ASC",
      params: [caseId],
    });
  }

  async getAnchor(anchorId: string): Promise<AnchorEvent | null> {
    const database = await this.ready();
    const rows = await database.query<AnchorEvent>({
      sql: "SELECT id, case_id, subject_type, subject_id, payload_hash, prev_hash, signed_by, signed_at FROM anchor_events WHERE id = ?",
      params: [anchorId],
    });
    return rows[0] ?? null;
  }

  /**
   * Recomputes the hash of the anchored subject from live storage and compares it to stored payload_hash.
   * Returns public verification details with ZERO personal identifying information.
   */
  async verifyAnchor(anchorId: string): Promise<PublicAnchorVerification | null> {
    const anchor = await this.getAnchor(anchorId);
    if (!anchor) return null;

    const database = await this.ready();
    let recomputedHash: string | null = null;

    if (anchor.subject_type === "verification_result") {
      const rows = await database.query<{ payload: string }>({
        sql: "SELECT payload FROM verification_results WHERE case_id = ? AND id = ?",
        params: [anchor.case_id, anchor.subject_id],
      });
      if (rows[0]) {
        const parsed = JSON.parse(rows[0].payload);
        recomputedHash = computePayloadHash(parsed);
      }
    }

    const matches = recomputedHash !== null && recomputedHash === anchor.payload_hash;

    return {
      matches,
      recomputedHash,
      storedHash: anchor.payload_hash,
      signedBy: anchor.signed_by,
      signedAt: anchor.signed_at,
      caseReference: `Case ${anchor.case_id}`,
    };
  }
}

export const anchorService = new AnchorService();
