import { afterEach, describe, expect, it } from "vitest";
import { CaseApplicationService } from "@/server/case-application-service";
import { documentApplicationService } from "@/server/document-application-service";
import { postgresSql, resetDatabaseForTests, setDatabaseForTests, SupabasePostgresAdapter, type PostgresClient, type PostgresQueryClient, type SqlValue } from "@/server/database";
import { ReviewPacketService } from "@/server/review-packet-service";
import { verificationService } from "@/server/verification-service";
import { parcelGeometryService } from "@/server/parcel-geometry-service";

type StoredRow = Record<string, SqlValue>;

class MockPostgresClient implements PostgresClient {
  readonly queries: Array<{ query: string; params: SqlValue[] }> = [];
  readonly tables = new Map<string, Map<string, StoredRow>>();
  transactionCount = 0;

  private table(name: string) { const table = this.tables.get(name) ?? new Map<string, StoredRow>(); this.tables.set(name, table); return table; }

  async unsafe(query: string, params: SqlValue[] = []): Promise<unknown> {
    this.queries.push({ query, params });
    if (query.startsWith("CREATE ") || query.startsWith("SELECT 1")) return query.startsWith("SELECT 1") ? [{ ok: 1 }] : [];
    const selectId = query.match(/^SELECT id FROM (\w+) WHERE id = \$1$/);
    if (selectId) return this.table(selectId[1]!).has(String(params[0])) ? [{ id: params[0] }] : [];
    if (query.startsWith("UPDATE parcel_geometries SET geometry_json = $1, source_reference = $2, updated_at = $3 WHERE id = $4")) {
      const row = this.table("parcel_geometries").get(String(params[3]));
      if (row && row.case_id === params[4] && row.parcel_id === params[5] && row.source_type === params[6] && row.geometry_json === params[7]) Object.assign(row, { geometry_json: params[0], source_reference: params[1], updated_at: params[2] });
      return [];
    }
    const selectCase = query.match(/^SELECT payload FROM (\w+) WHERE case_id = \$1$/);
    if (selectCase) return [...this.table(selectCase[1]!).values()].filter((row) => row.case_id === params[0]).map((row) => ({ payload: row.payload }));
    const selectIdPayload = query.match(/^SELECT payload FROM (\w+) WHERE id = \$1$/);
    if (selectIdPayload) { const row = this.table(selectIdPayload[1]!).get(String(params[0])); return row ? [{ payload: row.payload }] : []; }
    if (query.startsWith("SELECT id,case_id,parcel_id,geometry_json,source_type,source_reference,created_at,updated_at FROM parcel_geometries WHERE case_id = $1 AND parcel_id = $2")) { const row = [...this.table("parcel_geometries").values()].find((value) => value.case_id === params[0] && value.parcel_id === params[1]); return row ? [row] : []; }
    const insert = query.match(/^INSERT INTO (\w+) \(([^)]+)\)/);
    if (insert) { const fields = insert[2]!.split(","); const row = Object.fromEntries(fields.map((field, index) => [field, params[index] ?? null])); this.table(insert[1]!).set(String(row.id), row); return []; }
    const remove = query.match(/^DELETE FROM (\w+) WHERE (case_id|id) = \$1$/);
    if (remove) { for (const [id, row] of this.table(remove[1]!).entries()) if (row[remove[2]!] === params[0]) this.table(remove[1]!).delete(id); return []; }
    throw new Error(`Unhandled mock Postgres query: ${query}`);
  }

  async begin<T>(callback: (transaction: PostgresQueryClient) => Promise<T>): Promise<T> { this.transactionCount += 1; return callback({ unsafe: this.unsafe.bind(this) }); }
}

afterEach(() => resetDatabaseForTests());

describe("SupabasePostgresAdapter", () => {
  it("numbers every SQLite-style placeholder correctly, including the first", () => {
    expect(postgresSql("?")).toBe("$1");
    expect(postgresSql("?, ?")).toBe("$1, $2");
    expect(postgresSql("?, ?, ?")).toBe("$1, $2, $3");
    expect(postgresSql("SELECT payload FROM cases WHERE id = ? AND synthetic = ?")).toBe("SELECT payload FROM cases WHERE id = $1 AND synthetic = $2");
  });

  it("initializes the schema and delegates parameterized queries and transactions", async () => {
    const client = new MockPostgresClient();
    const database = new SupabasePostgresAdapter(client);
    await database.initialize();
    await database.query({ sql: "SELECT payload FROM cases WHERE id = ?", params: ["demo-family-001"] });
    await database.transaction([{ sql: "INSERT INTO cases (id,payload,created_at,updated_at,synthetic) VALUES (?,?,?,?,?)", params: ["demo", "{}", "now", "now", true] }]);
    expect(client.queries.some(({ query }) => query.startsWith("CREATE TABLE IF NOT EXISTS cases"))).toBe(true);
    expect(client.queries).toContainEqual({ query: "SELECT payload FROM cases WHERE id = $1", params: ["demo-family-001"] });
    expect(client.queries).toContainEqual({ query: "INSERT INTO cases (id,payload,created_at,updated_at,synthetic) VALUES ($1,$2,$3,$4,$5)", params: ["demo", "{}", "now", "now", true] });
    expect(client.transactionCount).toBe(1);
  });

  it("seeds, reads, creates, retrieves documents and packets through the Postgres contract", async () => {
    const client = new MockPostgresClient();
    const database = new SupabasePostgresAdapter(client);
    setDatabaseForTests(database);
    const cases = new CaseApplicationService();
    const hero = await cases.getCaseDetail("demo-family-001");
    const control = await cases.getCaseDetail("demo-family-002");
    expect(hero?.case.nickname).toBe("Demo Case 001");
    expect(control?.case.nickname).toBe("Demo Case 002");
    expect(await parcelGeometryService.getForParcel("demo-family-001", "demo-family-001-parcel", "DEMO-128", "DEMO-456")).toMatchObject({ id: "demo-family-001-geometry", provenance: "SYNTHETIC" });
    const oldHero = client.tables.get("parcel_geometries")?.get("demo-family-001-geometry");
    if (!oldHero) throw new Error("Expected the synthetic hero geometry to be seeded.");
    oldHero.geometry_json = JSON.stringify({ type: "Polygon", coordinates: [[[0, 0], [0.0005, 0], [0.0005, 0.0005], [0, 0.0005], [0, 0]]] });
    await parcelGeometryService.ensureSeedGeometries();
    expect(await parcelGeometryService.getForParcel("demo-family-001", "demo-family-001-parcel", "DEMO-128", "DEMO-456")).toMatchObject({ geometry: { coordinates: [[[0, 0], [0.000579, 0], [0.000579, 0.000579], [0, 0.000579], [0, 0]]] } });

    const oldControl = client.tables.get("parcel_geometries")?.get("demo-family-002-geometry");
    if (!oldControl) throw new Error("Expected the synthetic control geometry to be seeded.");
    oldControl.geometry_json = JSON.stringify({ type: "Polygon", coordinates: [[[0.01, 0.01], [0.01035, 0.01], [0.01035, 0.01035], [0.01, 0.01035], [0.01, 0.01]]] });
    await parcelGeometryService.ensureSeedGeometries();
    expect(await parcelGeometryService.getForParcel("demo-family-002", "demo-family-002-parcel", "DEMO-902", "DEMO-114")).toMatchObject({ geometry: { coordinates: [[[0.01, 0.01], [0.01064, 0.01], [0.01064, 0.01064], [0.01, 0.01064], [0.01, 0.01]]] }, sourceReference: "BHOOMICHECK-SYNTHETIC-GEO-002" });

    await documentApplicationService.ensureSeedDocuments();
    const documents = await documentApplicationService.list("demo-family-001");
    expect(documents.find((document) => document.id.endsWith("historical"))?.sourceText).toContain("1.20 acre");
    const verification = await verificationService.run("demo-family-001");
    expect(verification).toEqual(expect.arrayContaining([expect.objectContaining({ ruleId: "AREA_CONSISTENCY", outcome: "POTENTIAL_ISSUE" }), expect.objectContaining({ ruleId: "FAMILY_CONTEXT", outcome: "POTENTIAL_ISSUE" })]));

    const created = await cases.createCase({ district: "Demo District", circle: "Demo Circle", village: "Demo Mauza", khata: "DEMO-POSTGRES-001", nickname: "Synthetic Postgres case" });
    expect((await cases.getCaseDetail(created.case.id))?.case.nickname).toBe("Synthetic Postgres case");

    const packet = { id: "demo-family-001-packet", caseId: "demo-family-001", createdAt: "2026-01-01", updatedAt: "2026-01-01", status: "DRAFT" };
    await database.execute({ sql: "INSERT INTO review_packets (id,case_id,payload) VALUES (?,?,?)", params: [packet.id, packet.caseId, JSON.stringify(packet)] });
    expect(await new ReviewPacketService().get("demo-family-001", packet.id)).toMatchObject({ id: packet.id, caseId: packet.caseId });
    expect(client.transactionCount).toBeGreaterThan(1);
  });
});
