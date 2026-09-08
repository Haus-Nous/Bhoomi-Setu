"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function GlobeHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let currentWidth = canvas.offsetWidth || 500;

    const INDIA_COORDS: [number, number] = [22.9734, 78.6569];
    const BASE_MARKER_SIZE = 0.04;
    const CORE_COLOR: [number, number, number] = [0.79, 0.64, 0.31];
    const HALO_COLOR: [number, number, number] = [0.5, 0.42, 0.25];

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: currentWidth * 2,
      height: currentWidth * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.15, 0.22],
      markerColor: [0.79, 0.64, 0.31],
      glowColor: [0.32, 0.44, 0.62],
      markers: [
        { location: INDIA_COORDS, size: BASE_MARKER_SIZE * 2.4, color: HALO_COLOR },
        { location: INDIA_COORDS, size: BASE_MARKER_SIZE, color: CORE_COLOR },
      ],
    });

    const onResize = () => {
      if (!canvas) return;
      const nextWidth = canvas.offsetWidth || 500;
      if (nextWidth !== currentWidth) {
        currentWidth = nextWidth;
        globe.update({ width: currentWidth * 2, height: currentWidth * 2 });
      }
    };

    window.addEventListener("resize", onResize);

    let animationFrameId: number;
    const animate = () => {
      phi += 0.0025;
      // Halo oscillates between roughly 1.8x and 3.0x of BASE_MARKER_SIZE (calm ~5.6s cycle)
      const pulse = 2.4 + 0.6 * Math.sin(Date.now() / 900);
      const haloSize = BASE_MARKER_SIZE * pulse;
      globe.update({
        phi,
        markers: [
          { location: INDIA_COORDS, size: haloSize, color: HALO_COLOR },
          { location: INDIA_COORDS, size: BASE_MARKER_SIZE, color: CORE_COLOR },
        ],
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, []);

  return (
    <div className="globe-wrapper" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="globe-canvas"
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          aspectRatio: "1",
          display: "block",
        }}
      />
    </div>
  );
}
