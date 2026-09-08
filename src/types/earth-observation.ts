export type ImageryProviderName = "SYNTHETIC_IMAGERY_PROVIDER";
export type ImagerySourceType = "SYNTHETIC_CONTEXT_FIXTURE";
export type ImageryQuality = "DEMONSTRATION_ONLY" | "INSUFFICIENT_CONTEXT";
export type ImageryVisualVariant = "OPEN_VEGETATED" | "MODEST_BUILT_UP" | "STABLE_OPEN" | "LOW_QUALITY";
export type EarthObservationIndicatorType = "VEGETATION_CHANGE" | "BUILT_UP_CHANGE" | "SURFACE_CHANGE" | "WATER_CHANGE";
export type EarthObservationClassification = "STABLE" | "SMALL_CHANGE" | "NOTICEABLE_CHANGE" | "INSUFFICIENT_EVIDENCE";

export type ImagerySnapshot = {
  id: string;
  caseId: string;
  observationDate: string;
  provider: ImageryProviderName;
  sourceType: ImagerySourceType;
  assetReference: string;
  provenance: "SYNTHETIC_CONTEXT_FIXTURE";
  synthetic: true;
  authoritative: false;
  quality: ImageryQuality;
  visualVariant: ImageryVisualVariant;
  metrics?: Partial<Record<EarthObservationIndicatorType, number>>;
  notes: string;
};

export type EarthObservationIndicator = {
  type: EarthObservationIndicatorType;
  earlierValue: number | null;
  laterValue: number | null;
  deltaPercentagePoints: number | null;
  classification: EarthObservationClassification;
  explanationKey: "VEGETATION" | "BUILT_UP" | "SURFACE" | "WATER" | "INSUFFICIENT";
  provenance: "DETERMINISTIC_SYNTHETIC_CONTEXT_POLICY_V1";
  quality: ImageryQuality;
};

export type EarthObservationInsight = {
  caseId: string;
  parcel: { id: string; khata: string; khesra?: string };
  snapshots: ImagerySnapshot[];
  indicators: EarthObservationIndicator[];
  overallClassification: EarthObservationClassification;
  provider: ImageryProviderName;
  policy: {
    id: "BHOOMICHECK_SYNTHETIC_CONTEXT_V1";
    stableThresholdPercentagePoints: number;
    noticeableThresholdPercentagePoints: number;
  };
  provenance: "SYNTHETIC_CONTEXT_FIXTURE" | "NO_SYNTHETIC_FIXTURE";
  safety: {
    synthetic: true;
    authoritative: false;
    legalEvidence: false;
  };
};
