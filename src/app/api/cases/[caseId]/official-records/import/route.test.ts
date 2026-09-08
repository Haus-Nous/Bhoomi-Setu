import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GET,
  POST,
} from "@/app/api/cases/[caseId]/official-records/import/route";
import { getDatabase, resetDatabaseForTests } from "@/server/database";

const params = (caseId: string) => ({
  params: Promise.resolve({ caseId }),
});
const request = (officialRecordId?: string) =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(officialRecordId ? { officialRecordId } : {}),
  });

beforeEach(async () => {
  const database = getDatabase();
  await database.initialize();
  for (const caseId of ["demo-family-001", "demo-family-002"]) {
    await database.execute({
      sql: "DELETE FROM case_official_records WHERE case_id = ?",
      params: [caseId],
    });
  }
});

afterEach(() => resetDatabaseForTests());

describe("official record import and read API", () => {
  it("returns an empty persisted context for a known case and a safe error for an unknown case", async () => {
    const empty = await GET(
      new Request("http://localhost"),
      params("demo-family-001"),
    );
    const unknown = await GET(
      new Request("http://localhost"),
      params("unknown-case"),
    );

    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ data: [] });
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });

  it("persists and reads the hero fixture with its source traceability", async () => {
    const imported = await POST(
      request("synthetic-official-hero-001"),
      params("demo-family-001"),
    );
    const read = await GET(
      new Request("http://localhost"),
      params("demo-family-001"),
    );
    const body = (await read.json()) as {
      data: Array<{
        identityMatch: string;
        provenance: string;
        record: {
          parcelIdentity: { khataNumber: string; khesraNumber: string };
          recordData: { recordedArea: number };
          sourceMetadata: { authoritative: boolean };
        };
      }>;
    };

    expect(imported.status).toBe(200);
    expect(read.status).toBe(200);
    expect(body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        identityMatch: "EXACT_MATCH",
        provenance: "SYNTHETIC_OFFICIAL_FIXTURE",
        record: expect.objectContaining({
          parcelIdentity: expect.objectContaining({
            khataNumber: "DEMO-128",
            khesraNumber: "DEMO-456",
          }),
          recordData: expect.objectContaining({ recordedArea: 1.2 }),
          sourceMetadata: expect.objectContaining({ authoritative: false }),
        }),
      }),
    ]));
  });

  it("keeps hero and control imports isolated through fresh reads", async () => {
    await POST(
      request("synthetic-official-hero-001"),
      params("demo-family-001"),
    );
    const controlBefore = await GET(
      new Request("http://localhost"),
      params("demo-family-002"),
    );
    await POST(
      request("synthetic-official-control-002"),
      params("demo-family-002"),
    );
    const heroAfter = await GET(
      new Request("http://localhost"),
      params("demo-family-001"),
    );
    const controlAfter = await GET(
      new Request("http://localhost"),
      params("demo-family-002"),
    );

    expect(await controlBefore.json()).toEqual({ data: [] });
    expect((await heroAfter.json()).data).toEqual(expect.arrayContaining([
      expect.objectContaining({ officialRecordId: "synthetic-official-hero-001" }),
    ]));
    expect((await controlAfter.json()).data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        officialRecordId: "synthetic-official-control-002",
        provenance: "SYNTHETIC_OFFICIAL_FIXTURE",
        identityMatch: "EXACT_MATCH",
        record: expect.objectContaining({
          parcelIdentity: expect.objectContaining({
            khataNumber: "DEMO-902",
            khesraNumber: "DEMO-114",
          }),
          recordData: expect.objectContaining({ recordedArea: 1.25 }),
          sourceMetadata: expect.objectContaining({ authoritative: false }),
        }),
      }),
    ]));
  });

  it("keeps repeated imports as one logical linked record", async () => {
    const first = await POST(
      request("synthetic-official-hero-001"),
      params("demo-family-001"),
    );
    const repeated = await POST(
      request("synthetic-official-hero-001"),
      params("demo-family-001"),
    );
    const read = await GET(
      new Request("http://localhost"),
      params("demo-family-001"),
    );

    expect((await first.json()).alreadyImported).toBe(false);
    expect((await repeated.json()).alreadyImported).toBe(true);
    expect((await read.json()).data).toHaveLength(1);
  });

  it("rejects malformed, unknown, and mismatched imports safely", async () => {
    expect((await POST(request(), params("demo-family-001"))).status).toBe(400);
    expect((await POST(request("unknown"), params("demo-family-001"))).status).toBe(
      404,
    );
    expect(
      (
        await POST(
          request("synthetic-official-control-002"),
          params("demo-family-001"),
        )
      ).status,
    ).toBe(409);
    expect(
      (await POST(request("synthetic-official-hero-001"), params("unknown"))).status,
    ).toBe(404);
  });
});
