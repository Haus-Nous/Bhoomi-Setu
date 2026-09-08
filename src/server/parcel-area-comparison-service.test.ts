import { describe, expect, it } from "vitest";
import { areaSource, compareAllParcelAreas, compareParcelAreas, normalizeAreaToAcres, parcelAreaComparisonPolicy } from "@/server/parcel-area-comparison-service";
import type { ParcelAreaSource, ParcelAreaSourceType } from "@/types/geospatial";

const source = (sourceType: ParcelAreaSourceType, value: number | null, unit = "acre"): ParcelAreaSource => areaSource({ sourceType, sourceId: sourceType, sourceLabel: sourceType, rawValue: value, rawUnit: value === null ? null : unit, provenance: "SYNTHETIC", sourceReference: sourceType });

describe("parcel area normalization", () => {
  it("normalizes supported finite positive units to acres", () => {
    expect(normalizeAreaToAcres(1, "acre")).toBe(1);
    expect(normalizeAreaToAcres(1, "acres")).toBe(1);
    expect(normalizeAreaToAcres(1, "hectare")).toBeCloseTo(2.471053814671653, 12);
    expect(normalizeAreaToAcres(4_046.8564224, "square metres")).toBeCloseTo(1, 12);
    expect(normalizeAreaToAcres(4_046.8564224, "m²")).toBeCloseTo(1, 12);
  });
  it("does not guess malformed, unsupported, non-finite, zero, or negative inputs", () => {
    expect(normalizeAreaToAcres(1, "bigha")).toBeNull();
    expect(normalizeAreaToAcres("1", "acre")).toBeNull();
    expect(normalizeAreaToAcres(Number.NaN, "acre")).toBeNull();
    expect(normalizeAreaToAcres(0, "acre")).toBeNull();
    expect(normalizeAreaToAcres(-1, "acre")).toBeNull();
  });
});

describe("parcel area comparison policy", () => {
  const document = source("DOCUMENT_RECORD", 100);
  it("applies exact threshold boundaries and symmetric percentages", () => {
    expect(compareParcelAreas(document, source("SURVEY_RECORD", 100)).status).toBe("CONSISTENT");
    expect(compareParcelAreas(document, source("SURVEY_RECORD", 98.01)).status).toBe("CONSISTENT");
    expect(compareParcelAreas(document, source("SURVEY_RECORD", 98)).status).toBe("CONSISTENT");
    expect(compareParcelAreas(document, source("SURVEY_RECORD", 97.99)).status).toBe("REVIEW");
    expect(compareParcelAreas(document, source("SURVEY_RECORD", 95)).status).toBe("REVIEW");
    expect(compareParcelAreas(document, source("SURVEY_RECORD", 94.99)).status).toBe("POTENTIAL_ISSUE");
    const forward = compareParcelAreas(document, source("SURVEY_RECORD", 94));
    const backward = compareParcelAreas(source("SURVEY_RECORD", 94), document);
    expect(forward.percentageDifference).toBe(backward.percentageDifference);
  });
  it("returns insufficient evidence without inventing a difference", () => {
    expect(compareParcelAreas(document, source("SURVEY_RECORD", null)).status).toBe("INSUFFICIENT_EVIDENCE");
    expect(parcelAreaComparisonPolicy.policyId).toBe("BHOOMICHECK_DEMO_AREA_V1");
  });
  it("summarizes hero, control, and missing-source patterns deterministically", () => {
    const hero = compareAllParcelAreas([source("DOCUMENT_RECORD", 1.2), source("SURVEY_RECORD", 1.02), source("GEOMETRY_CALCULATED", 1.0242606211991474)]);
    expect(hero.comparisons.map((item) => item.status)).toEqual(["POTENTIAL_ISSUE", "POTENTIAL_ISSUE", "CONSISTENT"]);
    expect(hero.summary.key).toBe("HISTORICAL_DIFFERS_SURVEY_AND_GEOMETRY_ALIGN");
    const control = compareAllParcelAreas([source("DOCUMENT_RECORD", 1.25), source("SURVEY_RECORD", 1.25), source("GEOMETRY_CALCULATED", 1.2514493860915423)]);
    expect(control.comparisons.every((item) => item.status === "CONSISTENT")).toBe(true);
    expect(control.summary.key).toBe("ALL_AREA_SOURCES_CLOSELY_ALIGNED");
    expect(compareAllParcelAreas([source("DOCUMENT_RECORD", 1.25), source("SURVEY_RECORD", 1.25), source("GEOMETRY_CALCULATED", null)]).summary.key).toBe("AREA_COMPARISON_NEEDS_MORE_EVIDENCE");
  });
});
