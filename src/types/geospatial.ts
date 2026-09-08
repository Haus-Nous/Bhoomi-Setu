export type GeoJsonPosition = [number, number];
export type GeoJsonLinearRing = GeoJsonPosition[];
export type GeoJsonPolygon = { type: "Polygon"; coordinates: GeoJsonLinearRing[] };
export type GeoJsonMultiPolygon = { type: "MultiPolygon"; coordinates: GeoJsonLinearRing[][] };
export type ParcelGeoJson = GeoJsonPolygon | GeoJsonMultiPolygon;

export type ParcelGeometryProvenance = "SYNTHETIC" | "USER_IMPORTED" | "OFFICIAL_REFERENCE";
export type ParcelGeometrySourceType = "SYNTHETIC" | "USER_IMPORTED" | "OFFICIAL_REFERENCE";
export type GeometryQuality = "DEMONSTRATION_ONLY" | "UNVERIFIED" | "REFERENCE_ONLY";

export type ParcelGeometry = {
  id: string;
  caseId: string;
  parcelId: string;
  khataId: string;
  khesraId?: string;
  geometryType: ParcelGeoJson["type"];
  geometry: ParcelGeoJson;
  coordinateReferenceSystem: "EPSG:4326";
  sourceType: ParcelGeometrySourceType;
  sourceReference: string;
  importedAt: string;
  provenance: ParcelGeometryProvenance;
  quality: GeometryQuality;
  createdAt: string;
  updatedAt: string;
};

export type CalculatedGeometryArea = {
  squareMeters: number;
  hectares: number;
  acres: number;
  provenance: "CALCULATED_FROM_GEOMETRY";
};

export type ParcelAreaSourceType = "DOCUMENT_RECORD" | "SURVEY_RECORD" | "GEOMETRY_CALCULATED";
export type ParcelAreaAvailability = "AVAILABLE" | "UNAVAILABLE";
export type ParcelAreaSource = {
  sourceType: ParcelAreaSourceType;
  sourceId: string;
  sourceLabel: string;
  rawValue: number | null;
  rawUnit: string | null;
  normalizedAcres: number | null;
  provenance: string;
  availability: ParcelAreaAvailability;
  sourceReference: string;
};
export type ParcelAreaComparisonStatus = "CONSISTENT" | "REVIEW" | "POTENTIAL_ISSUE" | "INSUFFICIENT_EVIDENCE";
export type ParcelAreaPairwiseComparison = {
  leftSource: ParcelAreaSourceType;
  rightSource: ParcelAreaSourceType;
  absoluteDifferenceAcres: number | null;
  percentageDifference: number | null;
  status: ParcelAreaComparisonStatus;
  policyId: string;
  explanationKey: string;
};
export type ParcelAreaComparisonPolicy = {
  policyId: "BHOOMICHECK_DEMO_AREA_V1";
  consistentThresholdPercent: number;
  reviewThresholdPercent: number;
  legalDisclaimer: string;
};
export type ParcelAreaComparisonSummary = {
  key: "ALL_AREA_SOURCES_CLOSELY_ALIGNED" | "HISTORICAL_DIFFERS_SURVEY_AND_GEOMETRY_ALIGN" | "AREA_COMPARISON_NEEDS_MORE_EVIDENCE" | "AREA_COMPARISON_REVIEW_RECOMMENDED";
  status: ParcelAreaComparisonStatus;
};

export type ParcelIntelligence = {
  caseId: string;
  parcel: { id: string; khata: string; khesra?: string; district: string; circle: string; mauza: string };
  geometry: ParcelGeometry | null;
  calculatedArea: CalculatedGeometryArea | null;
  recordedAreas: { historical: { value: number; unit: "acre" } | null; survey: { value: number; unit: "acre" } | null };
  areaSources: ParcelAreaSource[];
  pairwiseComparisons: ParcelAreaPairwiseComparison[];
  comparisonSummary: ParcelAreaComparisonSummary;
  comparisonPolicy: ParcelAreaComparisonPolicy;
};
