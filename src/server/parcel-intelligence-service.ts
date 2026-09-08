import { caseApplicationService } from "@/server/case-application-service";
import { documentApplicationService } from "@/server/document-application-service";
import { geospatialService } from "@/server/geospatial-service";
import { parcelGeometryService } from "@/server/parcel-geometry-service";
import { parseSupportedArea } from "@/server/verification-service";
import { areaSource, compareAllParcelAreas } from "@/server/parcel-area-comparison-service";
import type { ParcelIntelligence } from "@/types/geospatial";

export class ParcelIntelligenceService {
  async get(caseId: string): Promise<ParcelIntelligence | null> {
    const detail = await caseApplicationService.getCaseDetail(caseId);
    const parcel = detail?.landParcels[0];
    if (!detail || !parcel) return null;
    const geometry = await parcelGeometryService.getForParcel(caseId, parcel.id, parcel.khata, parcel.khesra);
    const documents = await documentApplicationService.list(caseId);
    const historical = documents.find((document) => document.id.endsWith("historical")) ?? documents.find((document) => document.kind === "legacy-record" && document.id !== `${caseId}-document`);
    const survey = documents.find((document) => document.id.endsWith("survey")) ?? documents.find((document) => document.kind === "survey-record");
    const historicalArea = historical ? parseSupportedArea(historical.sourceText) : null;
    const surveyArea = survey ? parseSupportedArea(survey.sourceText) : null;
    const calculatedArea = geometry ? geospatialService.calculateArea(geometry) : null;
    const areaSources = [
      areaSource({ sourceType: "DOCUMENT_RECORD", sourceId: historical?.id ?? `${caseId}-historical-unavailable`, sourceLabel: historical?.title ?? "Historical record unavailable", rawValue: historicalArea?.value ?? null, rawUnit: historicalArea?.unit ?? null, provenance: "SYNTHETIC_DOCUMENT", sourceReference: historical?.id ?? "No historical source" }),
      areaSource({ sourceType: "SURVEY_RECORD", sourceId: survey?.id ?? `${caseId}-survey-unavailable`, sourceLabel: survey?.title ?? "Survey / Parcha unavailable", rawValue: surveyArea?.value ?? null, rawUnit: surveyArea?.unit ?? null, provenance: "SYNTHETIC_SURVEY_RECORD", sourceReference: survey?.id ?? "No survey source" }),
      areaSource({ sourceType: "GEOMETRY_CALCULATED", sourceId: geometry?.id ?? `${caseId}-geometry-unavailable`, sourceLabel: geometry ? "Calculated from synthetic parcel boundary" : "Mapped geometry unavailable", rawValue: calculatedArea?.acres ?? null, rawUnit: calculatedArea ? "acre" : null, provenance: calculatedArea?.provenance ?? "NO_GEOMETRY", sourceReference: geometry?.sourceReference ?? "No mapped parcel boundary" }),
    ];
    const comparison = compareAllParcelAreas(areaSources);
    return { caseId, parcel: { id: parcel.id, khata: parcel.khata, khesra: parcel.khesra, district: detail.case.location.district, circle: detail.case.location.circle, mauza: detail.case.location.village }, geometry, calculatedArea, recordedAreas: { historical: historicalArea ? { value: historicalArea.value, unit: historicalArea.unit } : null, survey: surveyArea ? { value: surveyArea.value, unit: surveyArea.unit } : null }, areaSources, pairwiseComparisons: comparison.comparisons, comparisonSummary: comparison.summary, comparisonPolicy: comparison.policy };
  }
}

export const parcelIntelligenceService = new ParcelIntelligenceService();
