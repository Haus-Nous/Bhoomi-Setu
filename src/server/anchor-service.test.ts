import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  anchorService,
  canonicalSerialize,
  computePayloadHash,
  VerificationResultNotFoundError,
} from "./anchor-service";
import { getDatabase, resetDatabaseForTests, setDatabaseForTests, LocalSqliteAdapter } from "./database";
import { CaseApplicationService } from "./case-application-service";
import { verificationService } from "./verification-service";

describe("AnchorService - Deterministic Canonical Serialization & Hashing", () => {
  it("serializes objects deterministically regardless of key order", () => {
    const objA = { b: 2, a: 1, c: { y: "world", x: "hello" } };
    const objB = { a: 1, c: { x: "hello", y: "world" }, b: 2 };

    const serializedA = canonicalSerialize(objA);
    const serializedB = canonicalSerialize(objB);

    expect(serializedA).toBe(serializedB);
    expect(serializedA).toBe('{"a":1,"b":2,"c":{"x":"hello","y":"world"}}');
    expect(computePayloadHash(objA)).toBe(computePayloadHash(objB));
  });

  it("handles arrays, primitives, and nulls correctly", () => {
    expect(canonicalSerialize(null)).toBe("null");
    expect(canonicalSerialize(123)).toBe("123");
    expect(canonicalSerialize("test")).toBe('"test"');
    expect(canonicalSerialize([3, 2, 1])).toBe("[3,2,1]");
    expect(canonicalSerialize([{ b: 1, a: 2 }])).toBe('[{"a":2,"b":1}]');
  });

  it("produces a completely different hash on 1-character modification", () => {
    const payloadA = { outcome: "PASS", ruleId: "AREA_CONSISTENCY", value: "1.20 acre" };
    const payloadB = { outcome: "PASS", ruleId: "AREA_CONSISTENCY", value: "1.21 acre" };

    const hashA = computePayloadHash(payloadA);
    const hashB = computePayloadHash(payloadB);

    expect(hashA).not.toBe(hashB);
    expect(hashA).toMatch(/^[a-f0-9]{64}$/);
    expect(hashB).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("AnchorService - Anchoring, Hash Chaining & Verification", () => {
  beforeEach(async () => {
    setDatabaseForTests(new LocalSqliteAdapter(":memory:"));
    const db = getDatabase();
    await db.initialize();
    // Ensure seed cases and verification results exist
    const cases = new CaseApplicationService();
    await cases.getCaseDetail("demo-family-001");
    await verificationService.run("demo-family-001");
    await cases.getCaseDetail("demo-family-002");
    await verificationService.run("demo-family-002");
  });

  afterEach(() => {
    resetDatabaseForTests();
  });

  it("anchors a verification result and builds a hash chain", async () => {
    const caseId = "demo-family-001";
    const result1Id = "demo-family-001-area-consistency";
    const result2Id = "demo-family-001-family-context";

    // Anchor first result
    const anchor1 = await anchorService.anchorVerificationResult(caseId, result1Id, "Officer Raman");
    expect(anchor1.id).toMatch(/^anc_[a-f0-9]{16}$/);
    expect(anchor1.case_id).toBe(caseId);
    expect(anchor1.subject_id).toBe(result1Id);
    expect(anchor1.prev_hash).toBeNull(); // First anchor has no prev_hash
    expect(anchor1.signed_by).toBe("Officer Raman");
    expect(anchor1.payload_hash).toMatch(/^[a-f0-9]{64}$/);

    // Anchor second result in same case
    const anchor2 = await anchorService.anchorVerificationResult(caseId, result2Id, "Officer Raman");
    expect(anchor2.case_id).toBe(caseId);
    expect(anchor2.subject_id).toBe(result2Id);
    expect(anchor2.prev_hash).toBe(anchor1.payload_hash); // Chained to previous anchor
    expect(anchor2.payload_hash).not.toBe(anchor1.payload_hash);

    // Anchor result in a different case (independent chain)
    const anchorOther = await anchorService.anchorVerificationResult(
      "demo-family-002",
      "demo-family-002-area-consistency"
    );
    expect(anchorOther.case_id).toBe("demo-family-002");
    expect(anchorOther.prev_hash).toBeNull(); // Independent chain starts at null
  });

  it("is idempotent when anchoring the same result repeatedly", async () => {
    const caseId = "demo-family-001";
    const resultId = "demo-family-001-area-consistency";

    const first = await anchorService.anchorVerificationResult(caseId, resultId);
    const second = await anchorService.anchorVerificationResult(caseId, resultId);

    expect(first.id).toBe(second.id);
    expect(first.payload_hash).toBe(second.payload_hash);
  });

  it("throws VerificationResultNotFoundError for non-existent result", async () => {
    await expect(
      anchorService.anchorVerificationResult("demo-family-001", "non-existent-result-id")
    ).rejects.toThrow(VerificationResultNotFoundError);
  });

  it("verifies record integrity and detects tampering", async () => {
    const caseId = "demo-family-001";
    const resultId = "demo-family-001-area-consistency";

    const anchor = await anchorService.anchorVerificationResult(caseId, resultId);

    // Initial check: matches
    const verification = await anchorService.verifyAnchor(anchor.id);
    expect(verification).not.toBeNull();
    expect(verification!.matches).toBe(true);
    expect(verification!.storedHash).toBe(anchor.payload_hash);
    expect(verification!.recomputedHash).toBe(anchor.payload_hash);
    expect(verification!.signedBy).toBe(anchor.signed_by);
    expect(verification!.caseReference).toBe(`Case ${caseId}`);

    // Mutate live storage directly (simulating tamper)
    const db = getDatabase();
    const rows = await db.query<{ payload: string }>({
      sql: "SELECT payload FROM verification_results WHERE case_id = ? AND id = ?",
      params: [caseId, resultId],
    });
    const parsed = JSON.parse(rows[0].payload);
    parsed.detail = "Modified detail outside app write paths";
    await db.execute({
      sql: "UPDATE verification_results SET payload = ? WHERE case_id = ? AND id = ?",
      params: [JSON.stringify(parsed), caseId, resultId],
    });

    // Verification check after tamper: mismatch detected!
    const tamperedVerification = await anchorService.verifyAnchor(anchor.id);
    expect(tamperedVerification).not.toBeNull();
    expect(tamperedVerification!.matches).toBe(false);
    expect(tamperedVerification!.storedHash).toBe(anchor.payload_hash);
    expect(tamperedVerification!.recomputedHash).not.toBe(anchor.payload_hash);
  });

  it("enforces zero PII in public verification response", async () => {
    const anchor = await anchorService.anchorVerificationResult(
      "demo-family-001",
      "demo-family-001-area-consistency"
    );
    const verification = await anchorService.verifyAnchor(anchor.id);
    expect(verification).toBeDefined();

    const keys = Object.keys(verification!);
    expect(keys.sort()).toEqual([
      "caseReference",
      "matches",
      "recomputedHash",
      "signedAt",
      "signedBy",
      "storedHash",
    ].sort());

    const serialized = JSON.stringify(verification);
    expect(serialized).not.toContain("Synthetic Holder");
    expect(serialized).not.toContain("Aadhaar");
    expect(serialized).not.toContain("sourceText");
    expect(serialized).not.toContain("documents");
  });
});

describe("Anchor Database Invariant - Append-Only Enforcement", () => {
  beforeEach(async () => {
    setDatabaseForTests(new LocalSqliteAdapter(":memory:"));
    const db = getDatabase();
    await db.initialize();
  });

  afterEach(() => {
    resetDatabaseForTests();
  });

  it("rejects UPDATE on anchor_events via SQLite database trigger", async () => {
    const db = getDatabase();
    // Insert a valid anchor
    await db.execute({
      sql: "INSERT INTO anchor_events (id, case_id, subject_type, subject_id, payload_hash, prev_hash, signed_by, signed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: ["anc_test_1", "case_1", "verification_result", "res_1", "hash1", null, "Signer", "2026-01-01"],
    });

    // Attempting an UPDATE should fail at database trigger level
    await expect(
      db.execute({
        sql: "UPDATE anchor_events SET payload_hash = ? WHERE id = ?",
        params: ["tampered_hash", "anc_test_1"],
      })
    ).rejects.toThrow(/anchor_events is append-only/i);
  });

  it("rejects DELETE on anchor_events via SQLite database trigger", async () => {
    const db = getDatabase();
    await db.execute({
      sql: "INSERT INTO anchor_events (id, case_id, subject_type, subject_id, payload_hash, prev_hash, signed_by, signed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: ["anc_test_2", "case_1", "verification_result", "res_2", "hash2", null, "Signer", "2026-01-01"],
    });

    // Attempting a DELETE should fail at database trigger level
    await expect(
      db.execute({
        sql: "DELETE FROM anchor_events WHERE id = ?",
        params: ["anc_test_2"],
      })
    ).rejects.toThrow(/anchor_events is append-only/i);
  });

  it("statically verifies that no source code in src/ contains UPDATE anchor_events or DELETE FROM anchor_events", () => {
    function getFiles(dir: string): string[] {
      const files: string[] = [];
      for (const item of readdirSync(dir)) {
        const fullPath = join(dir, item);
        if (statSync(fullPath).isDirectory()) {
          files.push(...getFiles(fullPath));
        } else if (/\.(ts|tsx|js|jsx)$/.test(item) && !item.endsWith(".test.ts")) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const srcDir = join(process.cwd(), "src");
    const files = getFiles(srcDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content).not.toMatch(/UPDATE\s+anchor_events/i);
      expect(content).not.toMatch(/DELETE\s+FROM\s+anchor_events/i);
    }
  });
});
