import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DocumentImportedRecords,
  importedRecordDocumentSummary,
} from "@/components/official-record-context";
import { LocaleProvider } from "@/components/locale-context";
import { getDatabase, resetDatabaseForTests } from "@/server/database";
import { documentApplicationService } from "@/server/document-application-service";
import { officialRecordService } from "@/server/official-record-service";

const renderDocumentsContext = (
  items: Awaited<ReturnType<typeof officialRecordService.list>> | null,
  status: "loading" | "error" | "ready" = "ready",
) =>
  renderToStaticMarkup(
    <LocaleProvider>
      <DocumentImportedRecords
        caseId="demo-family-001"
        items={items}
        status={status}
      />
    </LocaleProvider>,
  );

beforeEach(async () => {
  const database = getDatabase();
  await database.initialize();
  await database.execute({
    sql: "DELETE FROM case_official_records WHERE case_id = ?",
    params: ["demo-family-001"],
  });
  await database.execute({
    sql: "DELETE FROM case_official_records WHERE case_id = ?",
    params: ["demo-family-002"],
  });
});

afterEach(() => resetDatabaseForTests());

describe("Documents imported-record context", () => {
  it("renders a useful zero-import state", async () => {
    const items = await officialRecordService.list("demo-family-001");
    const markup = renderDocumentsContext(items);

    expect(items).toEqual([]);
    expect(markup).toContain("Imported records");
    expect(markup).toContain("No synthetic official-style record has been linked.");
    expect(markup).toContain("Search records");
  });

  it("renders persisted synthetic record fields separately from documents", async () => {
    await officialRecordService.import(
      "demo-family-001",
      "synthetic-official-hero-001",
    );
    const [item] = await officialRecordService.list("demo-family-001");
    const summary = importedRecordDocumentSummary(item!);
    const markup = renderDocumentsContext([item!]);

    expect(summary).toMatchObject({
      khata: "DEMO-128",
      khesra: "DEMO-456",
      recordedArea: "1.20 acre",
      provenance: "SYNTHETIC_OFFICIAL_FIXTURE",
      identityMatch: "EXACT_MATCH",
    });
    expect(markup).toContain("Synthetic official-style record");
    expect(markup).toContain("View record");
    expect(markup).toContain("BHOOMICHECK-SYNTHETIC-OFFICIAL-001");
  });

  it("keeps imports case-scoped and leaves the ordinary document collection unchanged", async () => {
    const before = await documentApplicationService.list("demo-family-001");
    await officialRecordService.import(
      "demo-family-001",
      "synthetic-official-hero-001",
    );
    const after = await documentApplicationService.list("demo-family-001");

    expect(await officialRecordService.list("demo-family-002")).toEqual([]);
    expect(after).toEqual(before);
    expect(
      after.some((document) =>
        document.id.includes("synthetic-official-hero-001"),
      ),
    ).toBe(false);
  });
});
