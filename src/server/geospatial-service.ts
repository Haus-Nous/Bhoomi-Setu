import turfArea from "@turf/area";
import type { CalculatedGeometryArea, GeoJsonLinearRing, ParcelGeoJson, ParcelGeometry } from "@/types/geospatial";

export const MAX_GEOMETRY_BYTES = 100_000;
export class GeometryValidationError extends Error {}

const isPosition = (value: unknown): value is [number, number] => Array.isArray(value) && value.length === 2 && value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));
const equalPosition = (left: [number, number], right: [number, number]) => left[0] === right[0] && left[1] === right[1];

const validateRing = (ring: unknown): GeoJsonLinearRing => {
  if (!Array.isArray(ring) || ring.length < 4) throw new GeometryValidationError("A polygon ring needs at least four closed coordinates.");
  const positions = ring.map((position) => {
    if (!isPosition(position)) throw new GeometryValidationError("Geometry coordinates must be finite longitude/latitude pairs.");
    const [longitude, latitude] = position;
    if (longitude < -180 || longitude > 180) throw new GeometryValidationError("Longitude is outside the supported range.");
    if (latitude < -90 || latitude > 90) throw new GeometryValidationError("Latitude is outside the supported range.");
    return [longitude, latitude] as [number, number];
  });
  if (!equalPosition(positions[0]!, positions.at(-1)!)) throw new GeometryValidationError("Polygon rings must be closed.");
  return positions;
};

const validatePolygon = (coordinates: unknown): GeoJsonLinearRing[] => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) throw new GeometryValidationError("A polygon needs at least one ring.");
  return coordinates.map(validateRing);
};

export function validateParcelGeoJson(value: unknown): ParcelGeoJson {
  let serialized: string;
  try { serialized = JSON.stringify(value); } catch { throw new GeometryValidationError("Geometry cannot be serialized."); }
  if (!serialized || serialized.length > MAX_GEOMETRY_BYTES) throw new GeometryValidationError("Geometry payload is too large.");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new GeometryValidationError("Geometry must be a GeoJSON object.");
  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type === "Polygon") return { type: "Polygon", coordinates: validatePolygon(candidate.coordinates) };
  if (candidate.type === "MultiPolygon") {
    if (!Array.isArray(candidate.coordinates) || candidate.coordinates.length === 0) throw new GeometryValidationError("A MultiPolygon needs at least one polygon.");
    return { type: "MultiPolygon", coordinates: candidate.coordinates.map(validatePolygon) };
  }
  throw new GeometryValidationError("Only GeoJSON Polygon and MultiPolygon geometries are supported.");
}

export class GeospatialService {
  validate(geometry: unknown) { return validateParcelGeoJson(geometry); }
  calculateArea(geometry: Pick<ParcelGeometry, "geometry">): CalculatedGeometryArea {
    const normalized = validateParcelGeoJson(geometry.geometry);
    const squareMeters = turfArea(normalized);
    if (!Number.isFinite(squareMeters) || squareMeters <= 0) throw new GeometryValidationError("Geometry must cover a measurable area.");
    return { squareMeters, hectares: squareMeters / 10_000, acres: squareMeters / 4_046.8564224, provenance: "CALCULATED_FROM_GEOMETRY" };
  }
}

export const geospatialService = new GeospatialService();
