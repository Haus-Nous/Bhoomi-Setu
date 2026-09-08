import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDatabase, resetDatabaseForTests } from "@/server/database";
import { parcelIntelligenceService } from "@/server/parcel-intelligence-service";
import { officialRecordService } from "@/server/official-record-service";
import { verificationService } from "@/server/verification-service";

const HERO = "demo-family-001";
const CONTROL = "demo-family-002";

beforeEach(async () => {
  const database = getDatabase();
  await database.initialize();
  for (const caseId of [HERO, CONTROL]) {
    await database.execute({
      sql: "DELETE FROM case_official_records WHERE case_id = ?",
      params: [caseId],
    });
  }
});

afterEach(() => resetDatabaseForTests());

describe("official-record case-context integration", () => {
  it("provides the dashboard context with a persisted, case-scoped linked-record count", async () => {
    expect(await officialRecordService.list(HERO)).toEqual([]);
    expect(await officialRecordService.list(CONTROL)).toEqual([]);

    await officialRecordService.import(HERO, "synthetic-official-hero-001");
    const heroFreshRead = await officialRecordService.list(HERO);
    const controlFreshRead = await officialRecordService.list(CONTROL);

    expect(heroFreshRead).toHaveLength(1);
    expect(heroFreshRead[0]).toMatchObject({
      caseId: HERO,
      officialRecordId: "synthetic-official-hero-001",
      identityMatch: "EXACT_MATCH",
    });
    expect(controlFreshRead).toEqual([]);

    await officialRecordService.import(
      CONTROL,
      "synthetic-official-control-002",
    );
    expect(await officialRecordService.list(HERO)).toHaveLength(1);
    expect(await officialRecordService.list(CONTROL)).toHaveLength(1);
  });

  it("keeps imported records outside the three-source parcel intelligence boundary", async () => {
    await officialRecordService.import(HERO, "synthetic-official-hero-001");
    await officialRecordService.import(
      CONTROL,
      "synthetic-official-control-002",
    );
    const hero = await parcelIntelligenceService.get(HERO);
    const control = await parcelIntelligenceService.get(CONTROL);

    expect(hero?.areaSources.map((source) => source.sourceType)).toEqual([
      "DOCUMENT_RECORD",
      "SURVEY_RECORD",
      "GEOMETRY_CALCULATED",
    ]);
    expect(hero?.areaSources).toHaveLength(3);
    expect(hero?.areaSources.some((source) =>
      source.provenance === "SYNTHETIC_OFFICIAL_FIXTURE",
    )).toBe(false);
    expect(hero?.pairwiseComparisons).toHaveLength(3);
    expect(hero?.pairwiseComparisons.map((comparison) => comparison.status)).toEqual([
      "POTENTIAL_ISSUE",
      "POTENTIAL_ISSUE",
      "CONSISTENT",
    ]);
    expect(hero?.comparisonSummary.key).toBe(
      "HISTORICAL_DIFFERS_SURVEY_AND_GEOMETRY_ALIGN",
    );

    expect(control?.areaSources.map((source) => source.sourceType)).toEqual([
      "DOCUMENT_RECORD",
      "SURVEY_RECORD",
      "GEOMETRY_CALCULATED",
    ]);
    expect(
      control?.pairwiseComparisons.every(
        (comparison) => comparison.status === "CONSISTENT",
      ),
    ).toBe(true);
    expect(control?.comparisonSummary.key).toBe(
      "ALL_AREA_SOURCES_CLOSELY_ALIGNED",
    );
  });

  it("does not change deterministic verification truth after an official-style import", async () => {
    await officialRecordService.import(HERO, "synthetic-official-hero-001");
    await officialRecordService.import(
      CONTROL,
      "synthetic-official-control-002",
    );

    const hero = await verificationService.run(HERO);
    const control = await verificationService.run(CONTROL);

    expect(hero).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: "AREA_CONSISTENCY",
          outcome: "POTENTIAL_ISSUE",
        }),
        expect.objectContaining({
          ruleId: "FAMILY_CONTEXT",
          outcome: "POTENTIAL_ISSUE",
        }),
      ]),
    );
    expect(control).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "AREA_CONSISTENCY", outcome: "PASS" }),
        expect.objectContaining({
          ruleId: "FAMILY_CONTEXT",
          outcome: "INSUFFICIENT_EVIDENCE",
        }),
      ]),
    );
  });
});
