"use client";

import React, { useEffect, useRef, useState } from "react";
import { getVillageSimulationEngine } from "@/lib/village-canvas";
import { useLocale } from "@/components/locale-context";
import { redesignI18n } from "@/lib/i18n";

export function CaseMapTile({ onGoDiff }: { onGoDiff?: () => void }) {
  const { locale } = useLocale();
  const r = redesignI18n[locale] || redesignI18n.en;

  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);

  const [scale, setScale] = useState(1);
  const [showFloat, setShowFloat] = useState(true);
  const [layers, setLayers] = useState({ hist: true, surv: true, mapd: true });

  useEffect(() => {
    const host = hostRef.current;
    const cv = canvasRef.current;
    const mini = miniCanvasRef.current;
    if (!host || !cv) return;

    const engine = getVillageSimulationEngine();
    const unregister = engine.registerInstance("mapCase", host, cv, mini);

    return () => {
      unregister();
    };
  }, []);

  const handleZoom = (delta: number) => {
    setScale((cur) => Math.min(1.8, Math.max(1, cur + delta)));
  };

  const handleFit = () => {
    setScale(1);
  };

  const toggleLayer = (layer: "hist" | "surv" | "mapd") => {
    setLayers((cur) => ({ ...cur, [layer]: !cur[layer] }));
  };

  return (
    <div className="tile c7 maptile" id="mapCase" ref={hostRef}>
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        <canvas ref={canvasRef} className="paint" aria-hidden="true" />
        <svg
          className="map"
          viewBox="0 0 600 560"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Painted view of a village around the parcel: fields, a lake with a small boat, a pond with a ghat and shrine, and egrets flying across. The historical boundary, shaded red, extends beyond the survey boundary."
        >
          <path
            data-layer="hist"
            className={layers.hist ? "" : "off"}
            d="M168 150 L408 110 L476 300 L458 418 L232 452 L150 300 Z M196 180 L390 148 L446 300 L430 396 L246 422 L180 300 Z"
            fill="#E5483B"
            fillOpacity=".26"
            fillRule="evenodd"
          />
          <path
            data-layer="hist"
            className={layers.hist ? "" : "off"}
            d="M168 150 L408 110 L476 300 L458 418 L232 452 L150 300 Z"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeDasharray="6 5"
            strokeOpacity=".9"
          />
          <path
            data-layer="surv"
            className={layers.surv ? "" : "off"}
            d="M196 180 L390 148 L446 300 L430 396 L246 422 L180 300 Z"
            fill="#C9F31D"
            fillOpacity=".12"
            stroke="#fff"
            strokeWidth="2.2"
          />
          <path
            data-layer="mapd"
            className={layers.mapd ? "" : "off"}
            d="M194 178 L392 147 L448 301 L431 398 L244 424 L178 300 Z"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            strokeDasharray="1.5 4"
            strokeLinecap="round"
          />
          <text
            x="312"
            y="295"
            textAnchor="middle"
            fill="#fff"
            stroke="rgba(20,30,15,.45)"
            strokeWidth="3"
            style={{ paintOrder: "stroke" }}
            fontFamily="Outfit,system-ui,sans-serif"
            fontSize="14"
            fontWeight="500"
          >
            DEMO-456
          </text>
        </svg>
      </div>

      <div className="layers" role="group" aria-label="Show or hide a boundary">
        <button
          type="button"
          aria-pressed={layers.hist}
          onClick={() => toggleLayer("hist")}
        >
          <i style={{ color: "var(--hist)" }} />
          <span>{r.lg_hist}</span>
        </button>
        <button
          type="button"
          aria-pressed={layers.surv}
          onClick={() => toggleLayer("surv")}
        >
          <i style={{ color: "#7DC242" }} />
          <span>{r.lg_surv}</span>
        </button>
        <button
          type="button"
          aria-pressed={layers.mapd}
          onClick={() => toggleLayer("mapd")}
        >
          <i style={{ color: "var(--ink)", borderTopStyle: "dotted" }} />
          <span>{r.lg_map}</span>
        </button>
      </div>

      <button
        type="button"
        className="fs"
        aria-label="Fit parcel"
        onClick={handleFit}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </button>

      {showFloat && (
        <div className="float">
          <div className="t-h">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 18 L8 6 L16 8 L21 18 Z" fill="currentColor" />
            </svg>
            <span>{r.fl_h}</span>
          </div>
          <div className="val">
            <span>
              <span className="t-sub">{r.fl_s}</span>
              <div className="spark" aria-hidden="true">
                <span style={{ height: "100%", background: "var(--hist)" }} />
                <span style={{ height: "85%", background: "#7DC242" }} />
                <span style={{ height: "85.4%", background: "#fff" }} />
              </div>
            </span>
            <b>0.18 ac</b>
          </div>
          <div className="acts">
            <button
              type="button"
              onClick={() => {
                if (onGoDiff) onGoDiff();
                else {
                  const el = document.getElementById("differences");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              {r.fl_a}
            </button>
            <button type="button" onClick={() => setShowFloat(false)}>
              {r.fl_b}
            </button>
          </div>
        </div>
      )}

      <div className="map-ctl">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => handleZoom(0.2)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => handleZoom(-0.2)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <div className="mini" aria-hidden="true">
        <canvas
          ref={miniCanvasRef}
          width="148"
          height="148"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </div>
  );
}
