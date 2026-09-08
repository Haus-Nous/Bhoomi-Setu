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
      glowColor: [0.25, 0.35, 0.5],
      markers: [{ location: [22.9734, 78.6569], size: 0.08 }],
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
      globe.update({ phi });
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
