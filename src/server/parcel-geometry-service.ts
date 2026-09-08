import { getDatabase } from "@/server/database";
import { validateParcelGeoJson } from "@/server/geospatial-service";
import type { ParcelGeoJson, ParcelGeometry } from "@/types/geospatial";

type GeometryRow = { id: string; case_id: string; parcel_id: string; geometry_json: string; source_type: string; source_reference: string; created_at: string; updated_at: string };

const syntheticGeometry = (id: string, caseId: string, parcelId: string, khataId: string, khesraId: string, sourceReference: string, geometry: ParcelGeoJson): ParcelGeometry => {
  const timestamp = "2026-01-01T00:00:00.000Z";
  return { id, caseId, parcelId, khataId, khesraId, geometryType: geometry.type, geometry, coordinateReferenceSystem: "EPSG:4326", sourceType: "SYNTHETIC", sourceReference, importedAt: timestamp, provenance: "SYNTHETIC", quality: "DEMONSTRATION_ONLY", createdAt: timestamp, updatedAt: timestamp };
};

const oldHeroGeometry: ParcelGeoJson = { type: "Polygon", coordinates: [[[0, 0], [0.0005, 0], [0.0005, 0.0005], [0, 0.0005], [0, 0]]] };
const correctedHeroGeometry: ParcelGeoJson = { type: "Polygon", coordinates: [[[0, 0], [0.000579, 0], [0.000579, 0.000579], [0, 0.000579], [0, 0]]] };
const oldControlGeometry: ParcelGeoJson = { type: "Polygon", coordinates: [[[0.01, 0.01], [0.01035, 0.01], [0.01035, 0.01035], [0.01, 0.01035], [0.01, 0.01]]] };
const correctedControlGeometry: ParcelGeoJson = { type: "Polygon", coordinates: [[[0.01, 0.01], [0.01064, 0.01], [0.01064, 0.01064], [0.01, 0.01064], [0.01, 0.01]]] };

const seedGeometries = [
  syntheticGeometry("demo-family-001-geometry", "demo-family-001", "demo-family-001-parcel", "DEMO-128", "DEMO-456", "BHOOMICHECK-SYNTHETIC-GEO-001-V2", correctedHeroGeometry),
  syntheticGeometry("demo-family-002-geometry", "demo-family-002", "demo-family-002-parcel", "DEMO-902", "DEMO-114", "BHOOMICHECK-SYNTHETIC-GEO-002", correctedControlGeometry),
] as const;

const fromRow = (row: GeometryRow): ParcelGeometry => {
  const geometry = validateParcelGeoJson(JSON.parse(row.geometry_json));
  return { id: row.id, caseId: row.case_id, parcelId: row.parcel_id, khataId: "", geometryType: geometry.type, geometry, coordinateReferenceSystem: "EPSG:4326", sourceType: row.source_type as ParcelGeometry["sourceType"], sourceReference: row.source_reference, importedAt: row.created_at, provenance: row.source_type as ParcelGeometry["provenance"], quality: "DEMONSTRATION_ONLY", createdAt: row.created_at, updatedAt: row.updated_at };
};

export class ParcelGeometryService {
  async ensureSeedGeometries() {
    const database = getDatabase();
    await database.initialize();
    for (const geometry of seedGeometries) {
      const existing = await database.query<{ id: string }>({ sql: "SELECT id FROM parcel_geometries WHERE id = ?", params: [geometry.id] });
      if (geometry.id === "demo-family-001-geometry" && existing.length) {
        await database.execute({ sql: "UPDATE parcel_geometries SET geometry_json = ?, source_reference = ?, updated_at = ? WHERE id = ? AND case_id = ? AND parcel_id = ? AND source_type = ? AND geometry_json = ?", params: [JSON.stringify(correctedHeroGeometry), geometry.sourceReference, geometry.updatedAt, geometry.id, geometry.caseId, geometry.parcelId, "SYNTHETIC", JSON.stringify(oldHeroGeometry)] });
      }
      if (geometry.id === "demo-family-002-geometry" && existing.length) {
        await database.execute({ sql: "UPDATE parcel_geometries SET geometry_json = ?, source_reference = ?, updated_at = ? WHERE id = ? AND case_id = ? AND parcel_id = ? AND source_type = ? AND geometry_json = ?", params: [JSON.stringify(correctedControlGeometry), geometry.sourceReference, geometry.updatedAt, geometry.id, geometry.caseId, geometry.parcelId, "SYNTHETIC", JSON.stringify(oldControlGeometry)] });
      }
      if (existing.length) continue;
      await database.execute({ sql: "INSERT INTO parcel_geometries (id,case_id,parcel_id,geometry_json,source_type,source_reference,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)", params: [geometry.id, geometry.caseId, geometry.parcelId, JSON.stringify(geometry.geometry), geometry.sourceType, geometry.sourceReference, geometry.createdAt, geometry.updatedAt] });
    }
  }

  async getForParcel(caseId: string, parcelId: string, khataId: string, khesraId?: string): Promise<ParcelGeometry | null> {
    await this.ensureSeedGeometries();
    const row = (await getDatabase().query<GeometryRow>({ sql: "SELECT id,case_id,parcel_id,geometry_json,source_type,source_reference,created_at,updated_at FROM parcel_geometries WHERE case_id = ? AND parcel_id = ?", params: [caseId, parcelId] }))[0];
    if (!row) return null;
    const geometry = fromRow(row);
    return { ...geometry, khataId, khesraId };
  }

  async resetSeedGeometry(caseId: string) {
    const seed = seedGeometries.find((geometry) => geometry.caseId === caseId);
    if (!seed) return;
    await getDatabase().transaction([{ sql: "DELETE FROM parcel_geometries WHERE case_id = ?", params: [caseId] }, { sql: "INSERT INTO parcel_geometries (id,case_id,parcel_id,geometry_json,source_type,source_reference,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)", params: [seed.id, seed.caseId, seed.parcelId, JSON.stringify(seed.geometry), seed.sourceType, seed.sourceReference, seed.createdAt, seed.updatedAt] }]);
  }
}

export const parcelGeometryService = new ParcelGeometryService();
