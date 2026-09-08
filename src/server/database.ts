import postgres from "postgres";

export type SqlValue = string | number | boolean | null;
export type SqlStatement = { sql: string; params?: SqlValue[] };
export class DatabaseConfigurationError extends Error {}

export interface DatabaseAdapter {
  readonly kind: "sqlite" | "postgres";
  initialize(): Promise<void>;
  query<T extends Record<string, unknown>>(statement: SqlStatement): Promise<T[]>;
  execute(statement: SqlStatement): Promise<void>;
  transaction(statements: SqlStatement[]): Promise<void>;
  ping(): Promise<void>;
}

export interface PostgresQueryClient {
  unsafe(query: string, params?: SqlValue[]): PromiseLike<unknown>;
}

export interface PostgresClient extends PostgresQueryClient {
  begin<T>(callback: (transaction: PostgresQueryClient) => Promise<T>): Promise<T>;
}

const schema = [
  "CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, synthetic BOOLEAN NOT NULL)",
  "CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS family_relationships (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS land_parcels (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS parcel_geometries (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, parcel_id TEXT NOT NULL, geometry_json TEXT NOT NULL, source_type TEXT NOT NULL, source_reference TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS survey_records (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS verification_results (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS case_actions (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS timeline_events (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS review_packets (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS case_official_records (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, official_record_id TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(case_id, official_record_id))",
  "CREATE TABLE IF NOT EXISTS document_extractions (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, document_id TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS documents_case_id ON documents(case_id)",
  "CREATE INDEX IF NOT EXISTS parcels_case_id ON land_parcels(case_id)",
  "CREATE INDEX IF NOT EXISTS parcel_geometries_case_parcel ON parcel_geometries(case_id, parcel_id)",
  "CREATE INDEX IF NOT EXISTS packets_case_id ON review_packets(case_id)",
  "CREATE INDEX IF NOT EXISTS official_records_case_id ON case_official_records(case_id)",
  "CREATE INDEX IF NOT EXISTS extraction_document_id ON document_extractions(case_id, document_id, created_at)",
];

export const postgresSql = (sql: string) => {
  let parameter = 0;
  return sql.replace(/\?/g, () => `$${++parameter}`);
};

class LocalSqliteAdapter implements DatabaseAdapter {
  readonly kind = "sqlite" as const;
  private database: import("node:sqlite").DatabaseSync | undefined;
  private initialized: Promise<void> | undefined;
  private async db() { if (!this.database) { const [{ DatabaseSync }, { mkdirSync }, { join }] = await Promise.all([import("node:sqlite"), import("node:fs"), import("node:path")]); mkdirSync(join(process.cwd(), "data"), { recursive: true }); this.database = new DatabaseSync(join(process.cwd(), "data", "bhoomi-check.sqlite")); } return this.database; }
  async initialize() { if (!this.initialized) this.initialized = (async () => { const db = await this.db(); for (const item of schema) db.exec(item); })(); return this.initialized; }
  async query<T extends Record<string, unknown>>({ sql, params = [] }: SqlStatement) { const db = await this.db(); return db.prepare(sql).all(...params.map((value) => typeof value === "boolean" ? Number(value) : value)) as T[]; }
  async execute({ sql, params = [] }: SqlStatement) { const db = await this.db(); db.prepare(sql).run(...params.map((value) => typeof value === "boolean" ? Number(value) : value)); }
  async transaction(statements: SqlStatement[]) { const db = await this.db(); db.exec("BEGIN"); try { for (const statement of statements) db.prepare(statement.sql).run(...(statement.params ?? []).map((value) => typeof value === "boolean" ? Number(value) : value)); db.exec("COMMIT"); } catch (error) { db.exec("ROLLBACK"); throw error; } }
  async ping() { await this.initialize(); await this.query({ sql: "SELECT 1 AS ok" }); }
}

export class SupabasePostgresAdapter implements DatabaseAdapter {
  readonly kind = "postgres" as const;
  private client: PostgresClient | undefined;
  private initialized: Promise<void> | undefined;
  constructor(client?: PostgresClient) { this.client = client; }
  private sql() { if (!this.client) this.client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, idle_timeout: 10, connect_timeout: 10 }) as unknown as PostgresClient; return this.client; }
  async initialize() { if (!this.initialized) this.initialized = (async () => { for (const item of schema) await this.sql().unsafe(item); })(); return this.initialized; }
  async query<T extends Record<string, unknown>>({ sql, params = [] }: SqlStatement) { return await this.sql().unsafe(postgresSql(sql), params) as T[]; }
  async execute(statement: SqlStatement) { await this.query(statement); }
  async transaction(statements: SqlStatement[]) { await this.sql().begin(async (transaction) => { for (const statement of statements) await transaction.unsafe(postgresSql(statement.sql), statement.params ?? []); }); }
  async ping() { await this.initialize(); await this.query({ sql: "SELECT 1 AS ok" }); }
}

let adapter: DatabaseAdapter | undefined;
export function getDatabase(): DatabaseAdapter {
  if (adapter) return adapter;
  if (process.env.DATABASE_URL) return adapter = new SupabasePostgresAdapter();
  if (process.env.VERCEL === "1") throw new DatabaseConfigurationError("Hosted persistence is not configured.");
  return adapter = new LocalSqliteAdapter();
}
export function resetDatabaseForTests() { adapter = undefined; }
export function setDatabaseForTests(value: DatabaseAdapter | undefined) { adapter = value; }
