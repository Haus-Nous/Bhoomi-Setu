import { describe, expect, it } from "vitest";
import { createPublicBasemapStyle, isBackgroundTileFailure, parcelBounds, parcelCameraOptions, parcelFeature, parcelRings } from "@/components/parcel-map";
import type { GeoJsonPolygon } from "@/types/geospatial";

const geometry: GeoJsonPolygon = { type: "Polygon", coordinates: [[[0, 0], [0.000579, 0], [0.000579, 0.000579], [0, 0.000579], [0, 0]]] };

describe("parcel map data preparation", () => {
  it("creates a synthetic GeoJSON feature and fits bounds from the actual parcel coordinates", () => {
    expect(parcelFeature(geometry)).toEqual({ type: "Feature", properties: { synthetic: true }, geometry });
    expect(parcelBounds(geometry)).toEqual([[0, 0], [0.000579, 0.000579]]);
    expect(parcelRings(geometry)).toEqual(geometry.coordinates);
  });

  it("uses an explicit HTTPS, key-free OSM source with parcel fill and outline layers", () => {
    const style = createPublicBasemapStyle(geometry, "#176b5b");
    expect(style.sources.openstreetmap).toMatchObject({ type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], attribution: "© OpenStreetMap contributors" });
    expect(style.layers.map((layer) => layer.id)).toEqual(["openstreetmap", "parcel-fill", "parcel-outline"]);
    expect(JSON.stringify(style)).not.toMatch(/api[_-]?key|access[_-]?token/i);
  });

  it("does not mistake aborted tiles for a basemap outage", () => {
    expect(isBackgroundTileFailure({ sourceId: "openstreetmap", error: { name: "AbortError", message: "Request aborted" } })).toBe(false);
    expect(isBackgroundTileFailure({ sourceId: "openstreetmap", error: { message: "HTTP 403 Forbidden" } })).toBe(true);
    expect(isBackgroundTileFailure({ sourceId: "parcel", error: { message: "parcel data error" } })).toBe(false);
  });

  it("uses camera-only responsive framing that gives small synthetic parcels useful prominence", () => {
    expect(parcelCameraOptions(360)).toEqual({ padding: 36, maxZoom: 20 });
    expect(parcelCameraOptions(1440)).toEqual({ padding: 72, maxZoom: 20 });
  });
});
