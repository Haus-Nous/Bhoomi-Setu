"use client";

import React, { useEffect, useRef } from "react";
import { getVillageSimulationEngine } from "@/lib/village-canvas";

export function VillageBackground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const cv = canvasRef.current;
    if (!host || !cv) return;

    const engine = getVillageSimulationEngine();
    const unregister = engine.registerInstance("mapHome", host, cv);

    return () => {
      unregister();
    };
  }, []);

  return (
    <div id="mapHome" ref={hostRef} className="hero-map scene-bg" aria-hidden="true">
      <div className="stage">
        <canvas ref={canvasRef} className="paint" aria-hidden="true" />
      </div>
    </div>
  );
}
