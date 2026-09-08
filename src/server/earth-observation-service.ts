import { caseApplicationService } from "@/server/case-application-service";
import { syntheticImageryProvider, type ImageryProvider } from "@/server/imagery-provider";
import type { EarthObservationClassification, EarthObservationIndicator, EarthObservationIndicatorType, EarthObservationInsight, ImagerySnapshot } from "@/types/earth-observation";

const indicators: Array<{ type: EarthObservationIndicatorType; explanationKey: EarthObservationIndicator["explanationKey"] }> = [
  { type: "VEGETATION_CHANGE", explanationKey: "VEGETATION" },
  { type: "BUILT_UP_CHANGE", explanationKey: "BUILT_UP" },
];

export const earthObservationPolicy = {
  id: "BHOOMICHECK_SYNTHETIC_CONTEXT_V1" as const,
  stableThresholdPercentagePoints: 4,
  noticeableThresholdPercentagePoints: 10,
};

export function classifySyntheticContextChange(deltaPercentagePoints: number | null): EarthObservationClassification {
  if (deltaPercentagePoints === null) return "INSUFFICIENT_EVIDENCE";
  const magnitude = Math.abs(deltaPercentagePoints);
  if (magnitude <= earthObservationPolicy.stableThresholdPercentagePoints) return "STABLE";
  if (magnitude <= earthObservationPolicy.noticeableThresholdPercentagePoints) return "SMALL_CHANGE";
  return "NOTICEABLE_CHANGE";
}

function insufficient(caseId: string, parcel: EarthObservationInsight["parcel"]): EarthObservationInsight {
  return {
    caseId,
    parcel,
    snapshots: [],
    indicators: indicators.map(({ type }) => ({ type, earlierValue: null, laterValue: null, deltaPercentagePoints: null, classification: "INSUFFICIENT_EVIDENCE", explanationKey: "INSUFFICIENT", provenance: "DETERMINISTIC_SYNTHETIC_CONTEXT_POLICY_V1", quality: "INSUFFICIENT_CONTEXT" })),
    overallClassification: "INSUFFICIENT_EVIDENCE",
    provider: "SYNTHETIC_IMAGERY_PROVIDER",
    policy: earthObservationPolicy,
    provenance: "NO_SYNTHETIC_FIXTURE",
    safety: { synthetic: true, authoritative: false, legalEvidence: false },
  };
}

function buildIndicators(snapshots: ImagerySnapshot[]): EarthObservationIndicator[] {
  const [earlier, later] = snapshots;
  return indicators.map(({ type, explanationKey }) => {
    const earlierValue = earlier?.metrics?.[type] ?? null;
    const laterValue = later?.metrics?.[type] ?? null;
    const deltaPercentagePoints = earlierValue === null || laterValue === null ? null : laterValue - earlierValue;
    return { type, earlierValue, laterValue, deltaPercentagePoints, classification: classifySyntheticContextChange(deltaPercentagePoints), explanationKey: deltaPercentagePoints === null ? "INSUFFICIENT" : explanationKey, provenance: "DETERMINISTIC_SYNTHETIC_CONTEXT_POLICY_V1", quality: earlier?.quality === "DEMONSTRATION_ONLY" && later?.quality === "DEMONSTRATION_ONLY" ? "DEMONSTRATION_ONLY" : "INSUFFICIENT_CONTEXT" };
  });
}

function overall(indicators: EarthObservationIndicator[]): EarthObservationClassification {
  if (indicators.some((indicator) => indicator.classification === "INSUFFICIENT_EVIDENCE")) return "INSUFFICIENT_EVIDENCE";
  if (indicators.some((indicator) => indicator.classification === "NOTICEABLE_CHANGE")) return "NOTICEABLE_CHANGE";
  if (indicators.some((indicator) => indicator.classification === "SMALL_CHANGE")) return "SMALL_CHANGE";
  return "STABLE";
}

export class EarthObservationService {
  constructor(private readonly provider: ImageryProvider = syntheticImageryProvider) {}

  async get(caseId: string): Promise<EarthObservationInsight | null> {
    const detail = await caseApplicationService.getCaseDetail(caseId);
    const parcel = detail?.landParcels[0];
    if (!detail || !parcel) return null;
    const identity = { id: parcel.id, khata: parcel.khata, khesra: parcel.khesra };
    const snapshots = await this.provider.getSnapshots(caseId);
    if (!snapshots || snapshots.length < 2) return insufficient(caseId, identity);
    const contextIndicators = buildIndicators(snapshots);
    return { caseId, parcel: identity, snapshots, indicators: contextIndicators, overallClassification: overall(contextIndicators), provider: "SYNTHETIC_IMAGERY_PROVIDER", policy: earthObservationPolicy, provenance: "SYNTHETIC_CONTEXT_FIXTURE", safety: { synthetic: true, authoritative: false, legalEvidence: false } };
  }
}

export const earthObservationService = new EarthObservationService();
