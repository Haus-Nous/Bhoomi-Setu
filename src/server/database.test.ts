import { afterEach, describe, expect, it } from "vitest";
import { DatabaseConfigurationError, getDatabase, resetDatabaseForTests } from "@/server/database";

const environment = { databaseUrl: process.env.DATABASE_URL, vercel: process.env.VERCEL };
afterEach(() => { if (environment.databaseUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = environment.databaseUrl; if (environment.vercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = environment.vercel; resetDatabaseForTests(); });

describe("database backend selection", () => {
  it("uses local SQLite without hosted configuration", async () => { delete process.env.DATABASE_URL; delete process.env.VERCEL; resetDatabaseForTests(); const database = getDatabase(); expect(database.kind).toBe("sqlite"); await database.ping(); });
  it("selects Postgres lazily when a server-only database URL is configured", () => { process.env.DATABASE_URL = "postgres://placeholder.example.invalid/demo"; delete process.env.VERCEL; resetDatabaseForTests(); expect(getDatabase().kind).toBe("postgres"); });
  it("fails safely on Vercel without hosted persistence configuration", () => { delete process.env.DATABASE_URL; process.env.VERCEL = "1"; resetDatabaseForTests(); expect(() => getDatabase()).toThrow(DatabaseConfigurationError); });
});
