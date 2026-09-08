import type { ImagerySnapshot } from "@/types/earth-observation";

export interface ImageryProvider {
  getSnapshots(caseId: string): Promise<ImagerySnapshot[] | null>;
}

const snapshot = (
  id: string,
  caseId: string,
  observationDate: string,
  visualVariant: ImagerySnapshot["visualVariant"],
  metrics: ImagerySnapshot["metrics"],
  notes: string,
): ImagerySnapshot => ({
  id,
  caseId,
  observationDate,
  provider: "SYNTHETIC_IMAGERY_PROVIDER",
  sourceType: "SYNTHETIC_CONTEXT_FIXTURE",
  assetReference: `synthetic://earth-observation/${id}`,
  provenance: "SYNTHETIC_CONTEXT_FIXTURE",
  synthetic: true,
  authoritative: false,
  quality: "DEMONSTRATION_ONLY",
  visualVariant,
  metrics,
  notes,
});

const fixtures: Record<string, ImagerySnapshot[]> = {
  "demo-family-001": [
    snapshot("hero-context-2023", "demo-family-001", "2023-02-12", "OPEN_VEGETATED", { VEGETATION_CHANGE: 68, BUILT_UP_CHANGE: 12 }, "Earlier synthetic open and vegetated context."),
    snapshot("hero-context-2025", "demo-family-001", "2025-02-18", "MODEST_BUILT_UP", { VEGETATION_CHANGE: 49, BUILT_UP_CHANGE: 27 }, "Later synthetic context with modest built-up surface."),
  ],
  "demo-family-002": [
    snapshot("control-context-2023", "demo-family-002", "2023-02-12", "STABLE_OPEN", { VEGETATION_CHANGE: 61, BUILT_UP_CHANGE: 18 }, "Earlier stable synthetic context."),
    snapshot("control-context-2025", "demo-family-002", "2025-02-18", "STABLE_OPEN", { VEGETATION_CHANGE: 59, BUILT_UP_CHANGE: 20 }, "Later stable synthetic context."),
  ],
};

export class SyntheticImageryProvider implements ImageryProvider {
  async getSnapshots(caseId: string): Promise<ImagerySnapshot[] | null> {
    return fixtures[caseId]?.map((item) => ({ ...item, metrics: { ...item.metrics } })) ?? null;
  }
}

export const syntheticImageryProvider = new SyntheticImageryProvider();
