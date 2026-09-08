import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";

const dbPath = join(process.cwd(), "data", "bhoomi-check.sqlite");

if (!existsSync(dbPath)) {
  console.error("Database not found at:", dbPath);
  console.error("Please run the app or run tests first to initialize the local SQLite database.");
  process.exit(1);
}

function canonicalSerialize(value: unknown): string {
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

function computePayloadHash(payload: unknown): string {
  return createHash("sha256").update(canonicalSerialize(payload)).digest("hex");
}

const args = process.argv.slice(2);
const isRestore = args.includes("--restore");
const caseIdIndex = args.indexOf("--case");
const caseId = caseIdIndex !== -1 && args[caseIdIndex + 1] ? args[caseIdIndex + 1] : "demo-family-001";
const resultIdIndex = args.indexOf("--result");
const resultId = resultIdIndex !== -1 && args[resultIdIndex + 1] ? args[resultIdIndex + 1] : "demo-family-001-area-consistency";

const db = new DatabaseSync(dbPath);

interface RowPayload {
  payload: string;
}

interface AnchorRow {
  id: string;
  payload_hash: string;
}

const existingRows = db.prepare("SELECT payload FROM verification_results WHERE case_id = ? AND id = ?").all(caseId, resultId) as unknown as RowPayload[];

if (!existingRows.length) {
  console.error(`Verification result not found in database: case_id=${caseId}, id=${resultId}`);
  process.exit(1);
}

const currentPayload = JSON.parse(existingRows[0].payload);
const currentHash = computePayloadHash(currentPayload);

const anchorRows = db.prepare("SELECT id, payload_hash FROM anchor_events WHERE case_id = ? AND subject_id = ?").all(caseId, resultId) as unknown as AnchorRow[];
const anchor = anchorRows[0];

if (isRestore) {
  if (currentPayload.detail && currentPayload.detail.includes(" [TAMPERED FOR DEMO]")) {
    currentPayload.detail = currentPayload.detail.replace(" [TAMPERED FOR DEMO]", "");
  }
  if (currentPayload.__tampered) {
    delete currentPayload.__tampered;
  }
  const restoredJson = JSON.stringify(currentPayload);
  db.prepare("UPDATE verification_results SET payload = ? WHERE case_id = ? AND id = ?").run(restoredJson, caseId, resultId);
  const restoredHash = computePayloadHash(currentPayload);

  console.log("==================================================================");
  console.log("RESTORE SUCCESSFUL");
  console.log("==================================================================");
  console.log(`Case ID:     ${caseId}`);
  console.log(`Result ID:   ${resultId}`);
  console.log(`Restored Hash: ${restoredHash}`);
  if (anchor) {
    console.log(`Stored Anchor Hash: ${anchor.payload_hash}`);
    console.log(`Status: ${restoredHash === anchor.payload_hash ? "MATCH (VALID)" : "MISMATCH"}`);
    console.log(`Public Verifier: http://localhost:3000/verify/${anchor.id}`);
  }
  process.exit(0);
}

// Tamper by mutating a field in the payload
if (!currentPayload.detail.includes(" [TAMPERED FOR DEMO]")) {
  currentPayload.detail += " [TAMPERED FOR DEMO]";
}
currentPayload.__tampered = true;

const tamperedJson = JSON.stringify(currentPayload);
db.prepare("UPDATE verification_results SET payload = ? WHERE case_id = ? AND id = ?").run(tamperedJson, caseId, resultId);
const newHash = computePayloadHash(currentPayload);

console.log("==================================================================");
console.log("DEMO TAMPER INJECTION (Demoware)");
console.log("==================================================================");
console.log(`Mutated table 'verification_results' directly in SQLite outside application write paths.`);
console.log(`Case ID:          ${caseId}`);
console.log(`Result ID:        ${resultId}`);
console.log(`Previous Hash:    ${currentHash}`);
console.log(`New Tampered Hash:${newHash}`);

if (anchor) {
  console.log(`\nStored Anchor:    ${anchor.id}`);
  console.log(`Stored Hash:      ${anchor.payload_hash}`);
  console.log(`Hash Matches:     ${newHash === anchor.payload_hash ? "YES" : "NO (MISMATCH DETECTED!)"}`);
  console.log(`\nView Public Verifier Page:`);
  console.log(`http://localhost:3000/verify/${anchor.id}`);
} else {
  console.log(`\nNote: No anchor event found yet for this result.`);
  console.log(`Visit http://localhost:3000/cases/${caseId}/verification and click 'Anchor this result', then re-run this script.`);
}
console.log("==================================================================");
console.log("To restore original clean record, run:");
console.log("npm run demo:tamper -- --restore");
console.log("==================================================================");
