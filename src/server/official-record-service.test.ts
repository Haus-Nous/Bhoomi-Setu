import { afterEach, describe, expect, it } from "vitest";
import { getDatabase, resetDatabaseForTests } from "@/server/database";
import { identityMatch, officialRecordService, validateOfficialSearch } from "@/server/official-record-service";
import { parcelGeometryService } from "@/server/parcel-geometry-service";
import { verificationService } from "@/server/verification-service";

afterEach(() => resetDatabaseForTests());
const hero = { district: " Demo District ", circle: "Demo Circle", mauza: "Example Mauza A", khataNumber: "demo-128", khesraNumber: "DEMO-456" };
describe("synthetic official record provider", () => {
  it("finds exact hero/control fixtures, deterministic ambiguity, and no invented records", async () => {
    const heroResult = await officialRecordService.search(hero); const control = await officialRecordService.search({ district: "Sample District", circle: "Sample Circle", mauza: "Example Mauza B", khataNumber: "DEMO-902" }); const ambiguous = await officialRecordService.search({ district: "Demo District", circle: "Demo Circle", mauza: "Ambiguous Mauza", khataNumber: "DEMO-AMB" }); const none = await officialRecordService.search({ district: "Demo District", circle: "Demo Circle", mauza: "Example Mauza A", khataNumber: "DEMO-NONE" });
    expect(heroResult?.results).toHaveLength(1); expect(heroResult?.results[0]).toMatchObject({ provenance: "SYNTHETIC_OFFICIAL_FIXTURE", sourceProvider: "synthetic", sourceMetadata: { authoritative: false } }); expect(control?.results).toHaveLength(1); expect(ambiguous?.results).toHaveLength(2); expect(none?.results).toEqual([]);
  });
  it("rejects invalid queries and exposes safe identity states", async () => {
    for (const value of [{}, { district: "D", circle: "C", mauza: "M" }, { district: "", circle: "C", mauza: "M", khataNumber: "K" }, { district: "D", circle: "", mauza: "M", khataNumber: "K" }, { district: "D", circle: "C", mauza: "", khesraNumber: "K" }, { district: 1, circle: "C", mauza: "M", khataNumber: "K" }]) expect(validateOfficialSearch(value)).toBeNull();
    const record = (await officialRecordService.search(hero))!.results[0]!;
    expect(identityMatch(record, { khata: "DEMO-128", khesra: "DEMO-456" }, { district: "Demo District", circle: "Demo Circle", village: "Example Mauza A" })).toBe("EXACT_MATCH");
    expect(identityMatch(record, { khata: "DEMO-128" }, { district: "Demo District", circle: "Demo Circle", village: "Example Mauza A" })).toBe("PARTIAL_MATCH");
    expect(identityMatch(record, { khata: "DEMO-128", khesra: "WRONG" }, { district: "Demo District", circle: "Demo Circle", village: "Example Mauza A" })).toBe("MISMATCH");
  });
});
describe("synthetic official record import", () => {
  it("imports hero/control idempotently without changing geometry or verification", async () => {
    await getDatabase().initialize(); await getDatabase().execute({ sql: "DELETE FROM case_official_records WHERE case_id = ?", params: ["demo-family-001"] }); await getDatabase().execute({ sql: "DELETE FROM case_official_records WHERE case_id = ?", params: ["demo-family-002"] });
    const heroGeometry = await parcelGeometryService.getForParcel("demo-family-001", "demo-family-001-parcel", "DEMO-128", "DEMO-456"); const heroVerification = await verificationService.run("demo-family-001");
    const first = await officialRecordService.import("demo-family-001", "synthetic-official-hero-001"); const repeat = await officialRecordService.import("demo-family-001", "synthetic-official-hero-001"); const control = await officialRecordService.import("demo-family-002", "synthetic-official-control-002");
    expect(first).toMatchObject({ alreadyImported: false, imported: { identityMatch: "EXACT_MATCH" } }); expect(repeat).toMatchObject({ alreadyImported: true }); expect(control).toMatchObject({ imported: { caseId: "demo-family-002", identityMatch: "EXACT_MATCH" } }); expect(await officialRecordService.list("demo-family-001")).toHaveLength(1); expect(await officialRecordService.list("demo-family-002")).toHaveLength(1); expect(await parcelGeometryService.getForParcel("demo-family-001", "demo-family-001-parcel", "DEMO-128", "DEMO-456")).toEqual(heroGeometry); expect(await verificationService.list("demo-family-001")).toEqual(heroVerification); expect(await officialRecordService.import("demo-family-001", "synthetic-official-control-002")).toMatchObject({ mismatch: true }); expect(await officialRecordService.import("demo-family-001", "unknown")).toBeNull();
    expect((await getDatabase().query<{ id: string }>({ sql: "SELECT id FROM case_official_records WHERE case_id = ?", params: ["demo-family-001"] }))).toHaveLength(1);
  });
});
