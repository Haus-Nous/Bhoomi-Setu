"use client";

import React, { useEffect, useRef, useState } from "react";
import { getVillageSimulationEngine } from "@/lib/village-canvas";
import { useLocale } from "@/components/locale-context";
import { redesignI18n } from "@/lib/i18n";

export function FoldedSurveyMap({
  onToast,
  onGoDifferences,
}: {
  onToast?: (msg: string) => void;
  onGoDifferences?: () => void;
}) {
  const { locale } = useLocale();
  const r = redesignI18n[locale] || redesignI18n.en;
  const isHi = locale === "hi";

  const [isOpen, setIsOpen] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState({ left: "50%", top: "50%", transform: "translate(-50%, -50%)" });
  const [bgUrl] = useState<string>(() =>
    typeof window !== "undefined" ? getVillageSimulationEngine().getSurveyMapDataUrl() : ""
  );

  const satARef = useRef<HTMLCanvasElement>(null);
  const satBRef = useRef<HTMLCanvasElement>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const engine = getVillageSimulationEngine();

    const updateThumbs = () => {
      if (satARef.current && satBRef.current) {
        engine.drawSatThumbs(satARef.current, satBRef.current);
      }
    };

    updateThumbs();
    const unregister = engine.onReady(updateThumbs);
    return () => {
      unregister();
    };
  }, []);

  const setMapState = (open: boolean) => {
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

  const handlePinClick = (e: React.MouseEvent<HTMLButtonElement>, pinId: string, left: number, top: number) => {
    e.stopPropagation();
    if (activePin === pinId) {
      setActivePin(null);
      return;
    }

    const hx = left > 70 ? "-88%" : left < 30 ? "-12%" : "-50%";
    const vy = top < 42 ? "16px" : "calc(-100% - 44px)";
    setCardPos({
      left: `${left}%`,
      top: `${top}%`,
      transform: `translate(${hx}, ${vy})`,
    });
    setActivePin(pinId);

    // Refresh thumbs if sat tab
    if (pinId === "sat") {
      setTimeout(() => {
        const engine = getVillageSimulationEngine();
        if (satARef.current && satBRef.current) {
          engine.drawSatThumbs(satARef.current, satBRef.current);
        }
      }, 50);
    }
  };

  const handleCloseCard = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActivePin(null);
  };

  const toggleOpen = () => {
    setMapState(!isOpen);
  };

  const buttonLabel = isHi
    ? isOpen
      ? "नक्शा मोड़ें"
      : "नक्शा खोलें"
    : isOpen
    ? "Fold map"
    : "Open map";

  return (
    <div id="evidence" className="panel" style={{ marginTop: 14 }}>
      <div className="ev-head">
        <div>
          <h2>{r.e_h}</h2>
          <p className="t-sub" style={{ margin: "4px 0 0" }}>
            {r.e_sub}
          </p>
        </div>
        <button
          type="button"
          className="btn2"
          id="fmapToggle"
          onClick={toggleOpen}
        >
          {buttonLabel}
        </button>
      </div>

      <div
        className={`fmap ${isOpen ? "open" : ""} ${isSettled ? "settled" : ""} ${activePin ? "carded" : ""}`}
        id="fmap"
        onClick={() => {
          if (!isOpen) setMapState(true);
        }}
      >
        <div className="fshadow" aria-hidden="true" />

        {/* Left Panel */}
        <div className="fpanel l">
          <div
            className="face front"
            style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
          />
          <button
            type="button"
            className="face back cover"
            id="fmapCover"
            aria-label="Unfold the evidence map"
            onClick={(e) => {
              e.stopPropagation();
              setMapState(true);
            }}
          >
            <span className="cv-band" />
            <span className="cv-kick">{r.fm_kick}</span>
            <span className="cv-title">{r.fm_title}</span>
            <span className="cv-sub">
              Example Mauza A<br />
              Khata DEMO-128
            </span>
            <svg className="cv-rose" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="17" fill="none" stroke="#5A4632" strokeWidth="1" />
              <path d="M20 4 L24 20 L20 36 L16 20 Z" fill="#5A4632" />
              <path d="M20 4 L24 20 L16 20 Z" fill="#B5532E" />
              <text x="20" y="3.5" fontSize="5" textAnchor="middle" fill="#5A4632" fontFamily="Georgia,serif">
                N
              </text>
            </svg>
            <span className="cv-cta">{r.fm_tap}</span>
          </button>
        </div>

        {/* Middle Panel */}
        <div className="fpanel m">
          <div
            className="face front"
            style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
          />
        </div>

        {/* Right Panel */}
        <div className="fpanel r">
          <div
            className="face front"
            style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
          />
          <div className="face back paperback" />
        </div>

        {/* Interactive Pins Overlay */}
        <div className="fpins">
          <button
            type="button"
            className="pin p-area"
            style={{ left: "54.6%", top: "45.4%" }}
            data-pin="area"
            aria-expanded={activePin === "area"}
            onClick={(e) => handlePinClick(e, "area", 54.6, 45.4)}
          >
            <span className="sr">{r.e1_s}</span>
          </button>
          <button
            type="button"
            className="pin p-off"
            style={{ left: "81.5%", top: "28.4%" }}
            data-pin="off"
            aria-expanded={activePin === "off"}
            onClick={(e) => handlePinClick(e, "off", 81.5, 28.4)}
          >
            <span className="sr">{r.e2_s}</span>
          </button>
          <button
            type="button"
            className="pin p-sat"
            style={{ left: "33.8%", top: "51%" }}
            data-pin="sat"
            aria-expanded={activePin === "sat"}
            onClick={(e) => handlePinClick(e, "sat", 33.8, 51)}
          >
            <span className="sr">{r.e3_s}</span>
          </button>

          {/* Floating Card */}
          <div
            className="fcard"
            id="fcard"
            hidden={!activePin}
            role="dialog"
            aria-live="polite"
            style={{
              left: cardPos.left,
              top: cardPos.top,
              transform: cardPos.transform,
              display: activePin ? "block" : "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="fx"
              id="fcardX"
              aria-label="Close"
              onClick={handleCloseCard}
            >
              ×
            </button>

            {/* Tab 1: Area */}
            <div data-card="area" className={activePin === "area" ? "on" : ""}>
              <div className="t-sub">{r.e1_s}</div>
              <div className="big" style={{ fontSize: 30, marginTop: 4 }}>
                3<span style={{ fontSize: 15, color: "var(--ink-3)" }}> / 4</span>
              </div>
              <ul className="fleg">
                <li>
                  <i className="ln h" />
                  <span>{r.lg_hist}</span>
                  <b>1.20 ac</b>
                </li>
                <li>
                  <i className="ln s" />
                  <span>{r.lg_surv}</span>
                  <b>1.02 ac</b>
                </li>
                <li>
                  <i className="ln m" />
                  <span>{r.lg_map}</span>
                  <b>1.0243 ac</b>
                </li>
              </ul>
              <p className="t-sub" style={{ margin: "8px 0 0" }}>
                {r.e1_p}
              </p>
              <button
                type="button"
                className="link"
                onClick={() => {
                  handleCloseCard();
                  if (onGoDifferences) onGoDifferences();
                  else {
                    const el = document.getElementById("differences");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {r.e1_go}
              </button>
            </div>

            {/* Tab 2: Official */}
            <div data-card="off" className={activePin === "off" ? "on" : ""}>
              <div className="t-sub">{r.e2_s}</div>
              <div className="big" style={{ fontSize: 30, marginTop: 4 }}>
                0
              </div>
              <p className="t-sub" style={{ margin: "6px 0 0" }}>
                {r.e2_p}
              </p>
              <button
                type="button"
                className="link"
                onClick={() => {
                  if (onToast) onToast("Search is not available in the demo");
                }}
              >
                {r.e2_go}
              </button>
            </div>

            {/* Tab 3: Satellite */}
            <div data-card="sat" className={activePin === "sat" ? "on" : ""}>
              <div className="t-sub">{r.e3_s}</div>
              <div className="sats">
                <figure>
                  <canvas ref={satARef} id="satA" width={240} height={160} />
                  <figcaption>{r.sat_a}</figcaption>
                </figure>
                <figure>
                  <canvas ref={satBRef} id="satB" width={240} height={160} />
                  <figcaption>{r.sat_b}</figcaption>
                </figure>
              </div>
              <p className="t-sub" style={{ margin: "8px 0 0" }}>
                {r.e3_p}
              </p>
              <button
                type="button"
                className="link"
                onClick={() => {
                  if (onToast) onToast("Image comparison is not available in the demo");
                }}
              >
                {r.e3_go}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
