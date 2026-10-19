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
  "CREATE TABLE IF NOT EXISTS anchor_events (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, subject_type TEXT NOT NULL, subject_id TEXT NOT NULL, payload_hash TEXT NOT NULL, prev_hash TEXT, signed_by TEXT NOT NULL, signed_at TEXT NOT NULL, UNIQUE(case_id, subject_type, subject_id))",
  "CREATE INDEX IF NOT EXISTS documents_case_id ON documents(case_id)",
  "CREATE INDEX IF NOT EXISTS parcels_case_id ON land_parcels(case_id)",
  "CREATE INDEX IF NOT EXISTS parcel_geometries_case_parcel ON parcel_geometries(case_id, parcel_id)",
  "CREATE INDEX IF NOT EXISTS packets_case_id ON review_packets(case_id)",
  "CREATE INDEX IF NOT EXISTS official_records_case_id ON case_official_records(case_id)",
  "CREATE INDEX IF NOT EXISTS extraction_document_id ON document_extractions(case_id, document_id, created_at)",
  "CREATE INDEX IF NOT EXISTS anchor_events_case_id ON anchor_events(case_id)",
];

const sqliteTriggers = [
  "CREATE TRIGGER IF NOT EXISTS prevent_anchor_events_update BEFORE UPDATE ON anchor_events BEGIN SELECT RAISE(ABORT, 'anchor_events is append-only'); END;",
  "CREATE TRIGGER IF NOT EXISTS prevent_anchor_events_delete BEFORE DELETE ON anchor_events BEGIN SELECT RAISE(ABORT, 'anchor_events is append-only'); END;",
];

const postgresTriggers = [
  `CREATE OR REPLACE FUNCTION raise_anchor_events_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'anchor_events is append-only';
END;
$$ LANGUAGE plpgsql;`,
  `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_anchor_events_update_delete'
  ) THEN
    CREATE TRIGGER prevent_anchor_events_update_delete
    BEFORE UPDATE OR DELETE ON anchor_events
    FOR EACH ROW EXECUTE FUNCTION raise_anchor_events_append_only();
  END IF;
END $$;`,
];

export const postgresSql = (sql: string) => {
  let parameter = 0;
  return sql.replace(/\?/g, () => `$${++parameter}`);
};

export class LocalSqliteAdapter implements DatabaseAdapter {
  readonly kind = "sqlite" as const;
  private database: import("node:sqlite").DatabaseSync | undefined;
  private initialized: Promise<void> | undefined;
  constructor(private dbPath?: string) {}
  private async db() {
    if (!this.database) {
      const [{ DatabaseSync }, { mkdirSync }, { join }] = await Promise.all([import("node:sqlite"), import("node:fs"), import("node:path")]);
      if (this.dbPath) {
        this.database = new DatabaseSync(this.dbPath);
      } else {
        const basePath = process.env.VERCEL === "1" ? "/tmp" : join(process.cwd(), "data");
        mkdirSync(basePath, { recursive: true });
        this.database = new DatabaseSync(join(basePath, "bhoomi-check.sqlite"));
      }
    }
    return this.database;
  }
  async initialize() { if (!this.initialized) this.initialized = (async () => { const db = await this.db(); for (const item of schema) db.exec(item); for (const item of sqliteTriggers) db.exec(item); })(); return this.initialized; }
  async query<T extends Record<string, unknown>>({ sql, params = [] }: SqlStatement) { const db = await this.db(); return db.prepare(sql).all(...params.map((value) => typeof value === "boolean" ? Number(value) : value)) as T[]; }
  async execute({ sql, params = [] }: SqlStatement) { const db = await this.db(); db.prepare(sql).run(...params.map((value) => typeof value === "boolean" ? Number(value) : value)); }
  async transaction(statements: SqlStatement[]) { const db = await this.db(); db.exec("BEGIN"); try { for (const statement of statements) db.prepare(statement.sql).run(...(statement.params ?? []).map((value) => typeof value === "boolean" ? Number(value) : value)); db.exec("COMMIT"); } catch (error) { db.exec("ROLLBACK"); throw error; } }
  async ping() { await this.initialize(); await this.query({ sql: "SELECT 1 AS ok" }); }
}

function isConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = (err as { message?: string }).message || "";
  const code = (err as { code?: string }).code || "";
  return code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT" || msg.includes("ENOTFOUND") || msg.includes("CONNECT_TIMEOUT") || msg.includes("tenant/user");
}

export class SupabasePostgresAdapter implements DatabaseAdapter {
  readonly kind = "postgres" as const;
  private client: PostgresClient | undefined;
  private initialized: Promise<void> | undefined;
  private fallback: LocalSqliteAdapter | undefined;
  constructor(client?: PostgresClient) { this.client = client; }
  private sql() { if (!this.client) this.client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, idle_timeout: 10, connect_timeout: 5 }) as unknown as PostgresClient; return this.client; }
  private async getFallback(): Promise<LocalSqliteAdapter> {
    if (!this.fallback) {
      const fallbackPath = process.env.VERCEL === "1" ? "/tmp/bhoomi-check.sqlite" : undefined;
      this.fallback = new LocalSqliteAdapter(fallbackPath);
      await this.fallback.initialize();
    }
    return this.fallback;
  }
  async initialize() {
    if (!this.initialized) {
      this.initialized = (async () => {
        try {
          for (const item of schema) await this.sql().unsafe(item);
          for (const item of postgresTriggers) await this.sql().unsafe(item);
        } catch (error) {
          if (!this.client && isConnectionError(error)) {
            console.warn("Postgres connection unavailable; using local SQLite storage:", error);
            await this.getFallback();
            return;
          }
          throw error;
        }
      })();
    }
    return this.initialized;
  }
  async query<T extends Record<string, unknown>>(statement: SqlStatement): Promise<T[]> {
    if (this.fallback) return this.fallback.query<T>(statement);
    try {
      return await this.sql().unsafe(postgresSql(statement.sql), statement.params ?? []) as T[];
    } catch (error) {
      if (!this.client && isConnectionError(error)) {
        const fb = await this.getFallback();
        return fb.query<T>(statement);
      }
      throw error;
    }
  }
  async execute(statement: SqlStatement): Promise<void> {
    if (this.fallback) return this.fallback.execute(statement);
    try {
      await this.query(statement);
    } catch (error) {
      if (!this.client && isConnectionError(error)) {
        const fb = await this.getFallback();
        await fb.execute(statement);
        return;
      }
      throw error;
    }
  }
  async transaction(statements: SqlStatement[]): Promise<void> {
    if (this.fallback) return this.fallback.transaction(statements);
    try {
      await this.sql().begin(async (transaction) => { for (const statement of statements) await transaction.unsafe(postgresSql(statement.sql), statement.params ?? []); });
    } catch (error) {
      if (!this.client && isConnectionError(error)) {
        const fb = await this.getFallback();
        await fb.transaction(statements);
        return;
      }
      throw error;
    }
  }
  async ping(): Promise<void> {
    if (this.fallback) return this.fallback.ping();
    try {
      await this.initialize();
      await this.query({ sql: "SELECT 1 AS ok" });
    } catch (error) {
      if (!this.client && isConnectionError(error)) {
        const fb = await this.getFallback();
        await fb.ping();
        return;
      }
      throw error;
    }
  }
}

let adapter: DatabaseAdapter | undefined;
export function getDatabase(): DatabaseAdapter {
  if (adapter) return adapter;
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith("file:") && !dbUrl.startsWith("sqlite:") && !dbUrl.includes("[SENSITIVE]")) {
    return adapter = new SupabasePostgresAdapter();
  }
  if (dbUrl && (dbUrl.startsWith("file:") || dbUrl.startsWith("sqlite:"))) {
    const rawPath = dbUrl.replace(/^(file:|sqlite:)\/?\/?/, "");
    return adapter = new LocalSqliteAdapter(rawPath ? (rawPath.startsWith("/") ? rawPath : `/${rawPath}`) : "/tmp/bhoomi-check.sqlite");
  }
  if (process.env.VERCEL === "1" && process.env.NODE_ENV === "test") {
    throw new DatabaseConfigurationError("Hosted persistence is not configured.");
  }
  const sqlitePath = process.env.VERCEL === "1" ? "/tmp/bhoomi-check.sqlite" : undefined;
  return adapter = new LocalSqliteAdapter(sqlitePath);
}
export function resetDatabaseForTests() { adapter = undefined; }
export function setDatabaseForTests(value: DatabaseAdapter | undefined) { adapter = value; }
