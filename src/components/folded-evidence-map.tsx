"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { getSharedPainting } from "./painted-scene";

// Seeded PRNG for survey map
function mulberry(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cachedSurveyMapBgUrl: string | null = null;

function generateSurveyMapBgUrl(): string {
  if (cachedSurveyMapBgUrl) return cachedSurveyMapBgUrl;
  if (typeof window === "undefined") return "";

  const MR = mulberry(77);
  function mr(a: number, b: number) {
    return a + (b - a) * MR();
  }
  const MW = 1200,
    MH = 800,
    MS = 2;
  const mc = document.createElement("canvas");
  mc.width = MW * MS;
  mc.height = MH * MS;
  const m = mc.getContext("2d");
  if (!m) return "";
  m.scale(MS, MS);

  function W(p: number[]): [number, number] {
    return [p[0] * 1.3 + 250, p[1] * 1.3 - 20];
  }
  function poly(pts: number[][], open?: boolean) {
    if (!m) return;
    m.beginPath();
    pts.forEach((p, i) => {
      const q = W(p);
      i ? m.lineTo(q[0], q[1]) : m.moveTo(q[0], q[1]);
    });
    if (!open) m.closePath();
  }

  const ink = "rgba(78,58,38,.85)";
  const serif = 'Georgia,"Times New Roman",serif';

  m.fillStyle = "#EFE5CB";
  m.fillRect(0, 0, MW, MH);

  // Staining washes
  for (let i = 0; i < 16; i++) {
    const x = mr(0, MW),
      y = mr(0, MH),
      r = mr(60, 220);
    const g2 = m.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, "rgba(160,120,60," + mr(0.03, 0.08).toFixed(3) + ")");
    g2.addColorStop(1, "rgba(160,120,60,0)");
    m.fillStyle = g2;
    m.fillRect(x - r, y - r, r * 2, r * 2);
  }

  m.save();
  m.beginPath();
  m.rect(46, 46, MW - 92, MH - 92);
  m.clip();

  // Roads
  const road1 = [
    [900, 226],
    [760, 236],
    [640, 248],
    [560, 268],
    [492, 258],
    [478, 200],
    [440, 140],
    [370, 98],
    [262, 86],
    [160, 94],
    [60, 118],
    [-40, 132],
  ];
  poly(road1, true);
  m.lineJoin = "round";
  m.lineCap = "round";
  m.strokeStyle = ink;
  m.lineWidth = 8;
  m.stroke();
  m.strokeStyle = "#EFE5CB";
  m.lineWidth = 5.6;
  m.stroke();

  // Parcel boundaries
  const HIST = [
    [168, 150],
    [408, 110],
    [476, 300],
    [458, 418],
    [232, 452],
    [150, 300],
  ];
  const SV = [
    [196, 180],
    [390, 148],
    [446, 300],
    [430, 396],
    [246, 422],
    [180, 300],
  ];
  const MP = [
    [194, 178],
    [392, 147],
    [448, 301],
    [431, 398],
    [244, 424],
    [178, 300],
  ];

  poly(SV);
  m.save();
  m.clip();
  m.strokeStyle = "rgba(46,107,58,.35)";
  m.lineWidth = 0.8;
  for (let d = -800; d < 1600; d += 6) {
    m.beginPath();
    m.moveTo(d, 0);
    m.lineTo(d + 800, 800);
    m.stroke();
  }
  m.restore();

  poly(HIST);
  m.setLineDash([9, 6]);
  m.strokeStyle = "#B23A2A";
  m.lineWidth = 2.4;
  m.stroke();
  m.setLineDash([]);

  poly(SV);
  m.strokeStyle = "#2E6B3A";
  m.lineWidth = 2.6;
  m.stroke();

  poly(MP);
  m.setLineDash([1.5, 4]);
  m.lineCap = "round";
  m.strokeStyle = "#2F4E8C";
  m.lineWidth = 2;
  m.stroke();
  m.setLineDash([]);

  // Parcel tag
  const pc = W([312, 250]);
  m.fillStyle = "#EFE5CB";
  m.fillRect(pc[0] - 38, pc[1] - 12, 76, 22);
  m.strokeStyle = ink;
  m.lineWidth = 1;
  m.strokeRect(pc[0] - 38, pc[1] - 12, 76, 22);
  m.fillStyle = "#2d2318";
  m.font = "bold 12px " + serif;
  m.textAlign = "center";
  m.fillText("DEMO-456", pc[0], pc[1] + 4);

  m.restore();

  // Border & grid
  m.strokeStyle = "#4e3a26";
  m.lineWidth = 3;
  m.strokeRect(30, 30, MW - 60, MH - 60);
  m.lineWidth = 1;
  m.strokeRect(46, 46, MW - 92, MH - 92);

  // Cartouche
  m.fillStyle = "rgba(239,229,203,.95)";
  m.fillRect(70, 66, 270, 96);
  m.strokeStyle = "#4e3a26";
  m.lineWidth = 1.2;
  m.strokeRect(70, 66, 270, 96);
  m.strokeRect(74, 70, 262, 88);

  m.textAlign = "left";
  m.fillStyle = "#2d2318";
  m.font = "italic 12px " + serif;
  m.fillText("Survey sheet (synthetic)", 88, 92);
  m.font = "26px " + serif;
  m.fillText("Example Mauza A", 88, 122);
  m.font = "12px " + serif;
  m.fillText("Khata DEMO-128   Khesra DEMO-456", 88, 146);

  // Legend
  m.fillStyle = "rgba(239,229,203,.95)";
  m.fillRect(70, MH - 196, 250, 128);
  m.strokeStyle = "#4e3a26";
  m.strokeRect(70, MH - 196, 250, 128);
  m.strokeRect(74, MH - 192, 242, 120);

  m.font = "italic 12px " + serif;
  m.fillStyle = "#2d2318";
  m.fillText("Boundaries of DEMO-456", 86, MH - 172);

  const legendItems: [string, number[], string][] = [
    ["#B23A2A", [9, 6], "Historical record, 1.20 ac"],
    ["#2E6B3A", [], "Survey, 1.02 ac"],
    ["#2F4E8C", [1.5, 4], "Mapped geometry, 1.0243 ac"],
  ];
  legendItems.forEach((l, i) => {
    const y3 = MH - 150 + i * 22;
    m.setLineDash(l[1]);
    m.strokeStyle = l[0];
    m.lineWidth = 2.4;
    m.beginPath();
    m.moveTo(86, y3);
    m.lineTo(118, y3);
    m.stroke();
    m.setLineDash([]);
    m.font = "12px " + serif;
    m.fillText(l[2], 128, y3 + 4);
  });

  // Compass
  const cx = MW - 96,
    cy = MH - 120;
  m.strokeStyle = "#4e3a26";
  m.lineWidth = 1;
  m.beginPath();
  m.arc(cx, cy, 30, 0, 6.283);
  m.stroke();
  m.fillStyle = "#4e3a26";
  m.beginPath();
  m.moveTo(cx, cy - 40);
  m.lineTo(cx + 7, cy);
  m.lineTo(cx, cy + 40);
  m.lineTo(cx - 7, cy);
  m.closePath();
  m.fill();
  m.fillStyle = "#B5532E";
  m.beginPath();
  m.moveTo(cx, cy - 40);
  m.lineTo(cx + 7, cy);
  m.lineTo(cx - 7, cy);
  m.fill();
  m.font = "bold 13px " + serif;
  m.fillText("N", cx, cy - 46);

  // Vignette & export
  const vg = m.createRadialGradient(
    mc.width / 2,
    mc.height / 2,
    mc.height * 0.45,
    mc.width / 2,
    mc.height / 2,
    mc.width * 0.62
  );
  vg.addColorStop(0, "rgba(120,80,30,0)");
  vg.addColorStop(1, "rgba(120,80,30,.22)");
  m.fillStyle = vg;
  m.fillRect(0, 0, mc.width, mc.height);

  cachedSurveyMapBgUrl = mc.toDataURL("image/jpeg", 0.88);
  return cachedSurveyMapBgUrl;
}

export function FoldedEvidenceMap({
  onToast,
  onScrollToDifferences,
}: {
  onToast: (msg: string) => void;
  onScrollToDifferences?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [activePin, setActivePin] = useState<"area" | "off" | "sat" | null>(null);
  const [mapBgUrl] = useState<string>(() => generateSurveyMapBgUrl());
  const satARef = useRef<HTMLCanvasElement>(null);
  const satBRef = useRef<HTMLCanvasElement>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { locale } = useLocale();

  const isHindi = locale === "hi";

  // Render synthetic satellite thumbnails
  useEffect(() => {
    if (activePin === "sat") {
      const renderSat = () => {
        const { painting } = getSharedPainting();
        if (!painting) return;
        const K = 2.5,
          OX = 240,
          OY = 380;
        const sx = (60 + OX) * K,
          sy = (300 + OY) * K,
          sw = 190 * K,
          sh = 170 * K * 0.75;
        if (satARef.current) {
          const ca = satARef.current.getContext("2d");
          if (ca) {
            ca.filter = "saturate(.55) sepia(.3) brightness(1.04) contrast(.92)";
            ca.drawImage(painting, sx, sy, sw, sh, 0, 0, 240, 160);
            ca.filter = "none";
          }
        }
        if (satBRef.current) {
          const cb = satBRef.current.getContext("2d");
          if (cb) {
            cb.drawImage(painting, sx, sy, sw, sh, 0, 0, 240, 160);
          }
        }
      };
      setTimeout(renderSat, 50);
    }
  }, [activePin]);

  const toggleMap = (open: boolean) => {
    setIsOpen(open);
    setIsSettled(false);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    if (open) {
      settleTimerRef.current = setTimeout(() => {
        setIsSettled(true);
      }, 1550);
    } else {
      setActivePin(null);
    }
  };

  const handlePinClick = (pin: "area" | "off" | "sat", e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePin === pin) {
      setActivePin(null);
    } else {
      setActivePin(pin);
    }
  };

  const frontStyle = mapBgUrl ? { backgroundImage: `url(${mapBgUrl})` } : {};

  return (
    <div id="evidence" className="panel" style={{ marginTop: 14 }}>
      <div className="ev-head">
        <div>
          <h2>{isHindi ? "सबूत और संदर्भ" : "Evidence and context"}</h2>
          <p className="t-sub" style={{ margin: "4px 0 0" }}>
            {isHindi
              ? "सहायक स्रोत, एक साथ। हर स्रोत की अपनी सीमाएँ हैं।"
              : "Supporting sources, kept together. Each one has limits on what it can show."}
          </p>
        </div>
        <button className="btn2" onClick={() => toggleMap(!isOpen)}>
          {isHindi ? (isOpen ? "नक्शा मोड़ें" : "नक्शा खोलें") : isOpen ? "Fold map" : "Open map"}
        </button>
      </div>

      <div
        className={`fmap ${isOpen ? "open" : ""} ${isSettled ? "settled" : ""} ${activePin ? "carded" : ""}`}
        onClick={() => {
          if (!isOpen) toggleMap(true);
        }}
      >
        <div className="fshadow" aria-hidden="true" />

        {/* Left Panel */}
        <div className="fpanel l">
          <div className="face front" style={frontStyle} />
          <button
            className="face back cover"
            onClick={(e) => {
              e.stopPropagation();
              toggleMap(true);
            }}
            aria-label="Unfold the evidence map"
          >
            <span className="cv-band" />
            <span className="cv-kick">
              {isHindi ? "सर्वे शीट, काल्पनिक" : "Survey sheet, synthetic"}
            </span>
            <span className="cv-title">{isHindi ? "मौज़ा नक्शा" : "Mauza map"}</span>
            <span className="cv-sub">
              Example Mauza A<br />Khata DEMO-128
            </span>
            <svg className="cv-rose" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="17" fill="none" stroke="#5A4632" strokeWidth="1" />
              <path d="M20 4 L24 20 L20 36 L16 20 Z" fill="#5A4632" />
              <path d="M20 4 L24 20 L16 20 Z" fill="#B5532E" />
              <text x="20" y="3.5" fontSize="5" textAnchor="middle" fill="#5A4632" fontFamily="Georgia,serif">
                N
              </text>
            </svg>
            <span className="cv-cta">{isHindi ? "खोलने के लिए छुएँ" : "Tap to unfold"}</span>
          </button>
        </div>

        {/* Middle Panel */}
        <div className="fpanel m">
          <div className="face front" style={frontStyle} />
        </div>

        {/* Right Panel */}
        <div className="fpanel r">
          <div className="face front" style={frontStyle} />
          <div className="face back paperback" />
        </div>

        {/* Interactive Map Pins */}
        <div className="fpins">
          <button
            className="pin p-area"
            style={{ left: "54.6%", top: "45.4%" }}
            aria-expanded={activePin === "area"}
            onClick={(e) => handlePinClick("area", e)}
          >
            <span className="sr">{isHindi ? "रकबे के स्रोत" : "Area sources"}</span>
          </button>

          <button
            className="pin p-off"
            style={{ left: "81.5%", top: "28.4%" }}
            aria-expanded={activePin === "off"}
            onClick={(e) => handlePinClick("off", e)}
          >
            <span className="sr">{isHindi ? "आधिकारिक-शैली रिकॉर्ड" : "Official-style record"}</span>
          </button>

          <button
            className="pin p-sat"
            style={{ left: "33.8%", top: "51%" }}
            aria-expanded={activePin === "sat"}
            onClick={(e) => handlePinClick("sat", e)}
          >
            <span className="sr">{isHindi ? "उपग्रह संदर्भ" : "Satellite context"}</span>
          </button>

          {/* Floating Dialog Card */}
          {activePin && (
            <div
              className="fcard"
              role="dialog"
              aria-live="polite"
              style={{
                left: activePin === "area" ? "54.6%" : activePin === "off" ? "81.5%" : "33.8%",
                top: activePin === "area" ? "45.4%" : activePin === "off" ? "28.4%" : "51%",
                transform:
                  activePin === "off"
                    ? "translate(-88%, 16px)"
                    : activePin === "sat"
                    ? "translate(-12%, calc(-100% - 44px))"
                    : "translate(-50%, calc(-100% - 44px))",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="fx" onClick={() => setActivePin(null)} aria-label="Close">
                ×
              </button>

              {activePin === "area" && (
                <div>
                  <div className="t-sub">{isHindi ? "रकबे के स्रोत" : "Area sources"}</div>
                  <div className="big" style={{ fontSize: 30, marginTop: 4 }}>
                    3<span style={{ fontSize: 15, color: "var(--ink-3)" }}> / 4</span>
                  </div>
                  <ul className="fleg">
                    <li>
                      <i className="ln h" />
                      <span>{isHindi ? "पुराना रिकॉर्ड" : "Historical"}</span>
                      <b>1.20 ac</b>
                    </li>
                    <li>
                      <i className="ln s" />
                      <span>{isHindi ? "सर्वे" : "Survey"}</span>
                      <b>1.02 ac</b>
                    </li>
                    <li>
                      <i className="ln m" />
                      <span>{isHindi ? "नक्शा" : "Mapped"}</span>
                      <b>1.0243 ac</b>
                    </li>
                  </ul>
                  <p className="t-sub" style={{ margin: "8px 0 0" }}>
                    {isHindi
                      ? "पुराना रिकॉर्ड, सर्वे और नक्शा। परचा अभी नहीं जोड़ा गया।"
                      : "Historical record, survey and mapped geometry. Parcha not yet added."}
                  </p>
                  <button
                    className="link"
                    onClick={() => {
                      if (onScrollToDifferences) onScrollToDifferences();
                      else {
                        const el = document.getElementById("differences");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    {isHindi ? "रकबा तुलना देखें" : "See area comparison"}
                  </button>
                </div>
              )}

              {activePin === "off" && (
                <div>
                  <div className="t-sub">{isHindi ? "आधिकारिक-शैली रिकॉर्ड" : "Official-style record"}</div>
                  <div className="big" style={{ fontSize: 30, marginTop: 4 }}>
                    0
                  </div>
                  <p className="t-sub" style={{ margin: "6px 0 0" }}>
                    {isHindi
                      ? "रैयत की तुलना मज़बूत करने के लिए एक जोड़ें।"
                      : "Link one to strengthen the holder comparison."}
                  </p>
                  <button
                    className="link"
                    onClick={() =>
                      onToast(isHindi ? "रिकॉर्ड खोज डेमो में उपलब्ध नहीं है" : "Search is not available in the demo")
                    }
                  >
                    {isHindi ? "रिकॉर्ड खोजें" : "Search records"}
                  </button>
                </div>
              )}

              {activePin === "sat" && (
                <div>
                  <div className="t-sub">{isHindi ? "उपग्रह संदर्भ" : "Satellite context"}</div>
                  <div className="sats">
                    <figure>
                      <canvas ref={satARef} width={240} height={160} />
                      <figcaption>{isHindi ? "पुराना चित्र" : "Earlier image"}</figcaption>
                    </figure>
                    <figure>
                      <canvas ref={satBRef} width={240} height={160} />
                      <figcaption>{isHindi ? "नया चित्र" : "Recent image"}</figcaption>
                    </figure>
                  </div>
                  <p className="t-sub" style={{ margin: "8px 0 0" }}>
                    {isHindi
                      ? "प्लॉट के आसपास बदलाव देखने के लिए काल्पनिक चित्र।"
                      : "Synthetic images to compare land-use change around the parcel."}
                  </p>
                  <button
                    className="link"
                    onClick={() =>
                      onToast(isHindi ? "चित्र तुलना डेमो में उपलब्ध नहीं है" : "Image comparison is not available in the demo")
                    }
                  >
                    {isHindi ? "बदलाव देखें" : "View change"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
