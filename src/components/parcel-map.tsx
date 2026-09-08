"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { ParcelGeoJson } from "@/types/geospatial";

const positions = (geometry: ParcelGeoJson) => geometry.type === "Polygon" ? geometry.coordinates.flat() : geometry.coordinates.flat(2);
export const parcelRings = (geometry: ParcelGeoJson) => geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();

export const parcelFeature = (geometry: ParcelGeoJson) => ({ type: "Feature" as const, properties: { synthetic: true }, geometry });
export const parcelBounds = (geometry: ParcelGeoJson): [[number, number], [number, number]] => {
  const points = positions(geometry);
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  return [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]];
};

/** Presentation-only camera settings. They never affect stored geometry or area calculations. */
export const parcelCameraOptions = (viewportWidth: number) => ({
  padding: viewportWidth <= 760 ? 36 : 72,
  maxZoom: 20,
});

export const createPublicBasemapStyle = (geometry: ParcelGeoJson, mapColor: string): StyleSpecification => ({
  version: 8,
  sources: {
    openstreetmap: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" },
    parcel: { type: "geojson", data: parcelFeature(geometry) },
  },
  layers: [
    { id: "openstreetmap", type: "raster", source: "openstreetmap" },
    { id: "parcel-fill", type: "fill", source: "parcel", paint: { "fill-color": mapColor, "fill-opacity": 0.42 } },
    { id: "parcel-outline", type: "line", source: "parcel", paint: { "line-color": mapColor, "line-width": 4 } },
  ],
});

type MapLibreErrorEvent = { sourceId?: string; error?: { name?: string; message?: string } };

/** Only a non-aborted raster-source error means the contextual basemap is unavailable. */
export const isBackgroundTileFailure = (event: unknown) => {
  const { sourceId, error } = event as MapLibreErrorEvent;
  if (sourceId !== "openstreetmap") return false;
  return !/abort|cancel/i.test(`${error?.name ?? ""} ${error?.message ?? ""}`);
};

export function ParcelMap({ geometry, label, loadingLabel, unavailableLabel, backgroundUnavailableLabel }: { geometry: ParcelGeoJson; label: string; loadingLabel: string; unavailableLabel: string; backgroundUnavailableLabel: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [backgroundUnavailable, setBackgroundUnavailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [overlay, setOverlay] = useState<{ width: number; height: number; paths: string[] } | null>(null);
  useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | undefined;
    void (async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (!container.current || disposed) return;
        const bounds = parcelBounds(geometry);
        const mapColor = getComputedStyle(document.documentElement).getPropertyValue("--green").trim();
        const instance = new maplibregl.Map({ container: container.current, style: createPublicBasemapStyle(geometry, mapColor), center: bounds[0], zoom: 16 });
        map = instance;
        instance.addControl(new maplibregl.NavigationControl(), "top-right");
        const updateOverlay = () => {
          if (disposed || !container.current) return;
          const { clientWidth: width, clientHeight: height } = container.current;
          setOverlay({ width, height, paths: parcelRings(geometry).map((ring) => ring.map((coordinate) => { const point = instance.project(coordinate); return `${point.x},${point.y}`; }).join(" ")) });
        };
        let readyHandled = false;
        const readyMap = () => {
          if (disposed || readyHandled) return;
          readyHandled = true;
          const mapWithSource = instance as unknown as { getSource: (id: string) => { setData: (data: unknown) => void } | undefined };
          mapWithSource.getSource("parcel")?.setData(parcelFeature(geometry));
          instance.fitBounds(bounds, parcelCameraOptions(container.current?.clientWidth ?? 760));
          setReady(true);
          updateOverlay();
        };
        instance.once("style.load", readyMap);
        if (instance.isStyleLoaded()) readyMap();
        instance.on("moveend", updateOverlay);
        instance.on("resize", updateOverlay);
        instance.on("error", (event) => { if (!disposed && isBackgroundTileFailure(event)) setBackgroundUnavailable(true); });
      } catch { if (!disposed) setUnavailable(true); }
    })();
    return () => { disposed = true; map?.remove(); };
  }, [geometry]);
  if (unavailable) return <div className="map-fallback" role="status">{unavailableLabel}</div>;
  return <figure className="parcel-map"><div ref={container} className="map-canvas" aria-label={label}>{overlay && <svg className="parcel-overlay" aria-hidden viewBox={`0 0 ${overlay.width} ${overlay.height}`}>{overlay.paths.map((points, index) => <polygon key={`${index}-${points}`} points={points} />)}</svg>}{!ready && <span className="map-loading">{loadingLabel}</span>}{backgroundUnavailable && <span className="map-background-warning" role="status">{backgroundUnavailableLabel}</span>}</div><figcaption>{label}</figcaption></figure>;
}
