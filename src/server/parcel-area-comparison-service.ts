import type { ParcelAreaComparisonPolicy, ParcelAreaComparisonStatus, ParcelAreaComparisonSummary, ParcelAreaPairwiseComparison, ParcelAreaSource, ParcelAreaSourceType } from "@/types/geospatial";

export const parcelAreaComparisonPolicy: ParcelAreaComparisonPolicy = {
  policyId: "BHOOMICHECK_DEMO_AREA_V1",
  consistentThresholdPercent: 2,
  reviewThresholdPercent: 5,
  legalDisclaimer: "BhoomiCheck demo comparison tolerances are not legal, cadastral, statutory, or government tolerances.",
};

const unitFactors: Record<string, number> = {
  acre: 1,
  acres: 1,
  hectare: 2.471053814671653,
  hectares: 2.471053814671653,
  "square metre": 1 / 4_046.8564224,
  "square metres": 1 / 4_046.8564224,
  "m²": 1 / 4_046.8564224,
};

export const normalizeAreaToAcres = (value: unknown, unit: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || typeof unit !== "string") return null;
  const factor = unitFactors[unit.trim().toLowerCase()];
  return factor ? value * factor : null;
};

export const areaSource = (source: Omit<ParcelAreaSource, "normalizedAcres" | "availability">): ParcelAreaSource => {
  const normalizedAcres = normalizeAreaToAcres(source.rawValue, source.rawUnit);
  return { ...source, normalizedAcres, availability: normalizedAcres === null ? "UNAVAILABLE" : "AVAILABLE" };
};

export const compareParcelAreas = (left: ParcelAreaSource, right: ParcelAreaSource): ParcelAreaPairwiseComparison => {
  const insufficient = left.normalizedAcres === null || right.normalizedAcres === null;
  if (insufficient) return { leftSource: left.sourceType, rightSource: right.sourceType, absoluteDifferenceAcres: null, percentageDifference: null, status: "INSUFFICIENT_EVIDENCE", policyId: parcelAreaComparisonPolicy.policyId, explanationKey: "AREA_COMPARISON_NEEDS_MORE_EVIDENCE" };
  const leftAcres = left.normalizedAcres;
  const rightAcres = right.normalizedAcres;
  if (leftAcres === null || rightAcres === null) throw new Error("Area comparison requires normalized values.");
  const absoluteDifferenceAcres = Math.abs(leftAcres - rightAcres);
  const percentageDifference = absoluteDifferenceAcres / Math.max(leftAcres, rightAcres) * 100;
  const status: ParcelAreaComparisonStatus = percentageDifference <= parcelAreaComparisonPolicy.consistentThresholdPercent ? "CONSISTENT" : percentageDifference <= parcelAreaComparisonPolicy.reviewThresholdPercent ? "REVIEW" : "POTENTIAL_ISSUE";
  return { leftSource: left.sourceType, rightSource: right.sourceType, absoluteDifferenceAcres, percentageDifference, status, policyId: parcelAreaComparisonPolicy.policyId, explanationKey: status === "CONSISTENT" ? "AREA_SOURCES_CLOSELY_ALIGNED" : status === "REVIEW" ? "AREA_COMPARISON_REVIEW_RECOMMENDED" : "AREA_COMPARISON_POTENTIAL_DIFFERENCE" };
};

export const summarizeParcelAreaComparisons = (comparisons: ParcelAreaPairwiseComparison[]): ParcelAreaComparisonSummary => {
  const byPair = (left: ParcelAreaSourceType, right: ParcelAreaSourceType) => comparisons.find((item) => item.leftSource === left && item.rightSource === right);
  const documentSurvey = byPair("DOCUMENT_RECORD", "SURVEY_RECORD");
  const documentGeometry = byPair("DOCUMENT_RECORD", "GEOMETRY_CALCULATED");
  const surveyGeometry = byPair("SURVEY_RECORD", "GEOMETRY_CALCULATED");
  if (documentSurvey?.status === "POTENTIAL_ISSUE" && documentGeometry?.status === "POTENTIAL_ISSUE" && surveyGeometry?.status === "CONSISTENT") return { key: "HISTORICAL_DIFFERS_SURVEY_AND_GEOMETRY_ALIGN", status: "POTENTIAL_ISSUE" };
  if (comparisons.length && comparisons.every((item) => item.status === "CONSISTENT")) return { key: "ALL_AREA_SOURCES_CLOSELY_ALIGNED", status: "CONSISTENT" };
  if (comparisons.some((item) => item.status === "INSUFFICIENT_EVIDENCE")) return { key: "AREA_COMPARISON_NEEDS_MORE_EVIDENCE", status: "INSUFFICIENT_EVIDENCE" };
  return { key: "AREA_COMPARISON_REVIEW_RECOMMENDED", status: comparisons.some((item) => item.status === "POTENTIAL_ISSUE") ? "POTENTIAL_ISSUE" : "REVIEW" };
};

export const compareAllParcelAreas = (sources: ParcelAreaSource[]) => {
  const source = (type: ParcelAreaSourceType) => sources.find((item) => item.sourceType === type)!;
  const comparisons = [compareParcelAreas(source("DOCUMENT_RECORD"), source("SURVEY_RECORD")), compareParcelAreas(source("DOCUMENT_RECORD"), source("GEOMETRY_CALCULATED")), compareParcelAreas(source("SURVEY_RECORD"), source("GEOMETRY_CALCULATED"))];
  return { comparisons, summary: summarizeParcelAreaComparisons(comparisons), policy: parcelAreaComparisonPolicy };
};
