"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CasePage } from "@/components/case-page";
import { useLocale } from "@/components/locale-context";
import { redesignI18n } from "@/lib/i18n";
import { PaintedScene } from "@/components/painted-scene";
import { FoldedEvidenceMap } from "@/components/folded-evidence-map";
import { useRouter } from "next/navigation";
import type { CaseDetail } from "@/types/case";

function CaseDashboardContent({
  detail,
  caseId,
}: {
  detail: CaseDetail;
  caseId: string;
}) {
  const { locale } = useLocale();
  const r = redesignI18n[locale] || redesignI18n.en;
  const isHi = locale === "hi";
  const router = useRouter();

  // Local state for differences review and accordion
  const [reviewed, setReviewed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("bs-reviewed");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [openDiffs, setOpenDiffs] = useState<Record<string, boolean>>({ area: false, name: false });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2500);
  };

  const toggleReview = (id: string) => {
    const next = { ...reviewed, [id]: !reviewed[id] };
    setReviewed(next);
    try {
      localStorage.setItem("bs-reviewed", JSON.stringify(next));
    } catch {}
    const isNowReviewed = next[id];
    triggerToast(
      isNowReviewed
        ? isHi
          ? "देख लिया"
          : "Marked as reviewed"
        : isHi
        ? "चिह्न हटाया"
        : "Marked as not reviewed"
    );
  };

  const handleReset = async () => {
    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error();
      setReviewed({});
      try {
        localStorage.removeItem("bs-reviewed");
      } catch {}
      triggerToast(isHi ? "डेमो केस रीसेट हुआ" : "Demo case reset");
      router.refresh();
    } catch {
      triggerToast(isHi ? "रीसेट विफल रहा" : "Reset failed");
    }
  };

  const parcel = detail.landParcels[0];
  const totalReviewed = (reviewed.area ? 1 : 0) + (reviewed.name ? 1 : 0);
  const stepCount = 3 + (totalReviewed === 2 ? 1 : 0);
  const diffsLeft = 2 - totalReviewed;

  return (
    <section id="v-case" className="view on">
      {/* Toast Notification */}
      <div className={`toast ${toastMsg ? "show" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>

      <div className="grid" id="overview">
        <div className="tile c5 plain" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <h1 className="display-h1" style={{ fontSize: "clamp(32px, 4.4vw, 54px)" }}>
            {detail.case.nickname || "Demo Case 001"}
          </h1>
          <p className="t-sub" style={{ margin: "10px 0 0", fontSize: 13 }}>
            {detail.case.location.village || "Example Mauza A"} &nbsp;&nbsp; Khata {parcel?.khata || "DEMO-128"} &nbsp;&nbsp; Khesra {parcel?.khesra || "DEMO-456"}
          </p>
        </div>

        {/* Area gap tile */}
        <div className="tile c3">
          <div className="t-h" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>{r.ac_h}</span>
            </span>
            <span className="t-sub">{r.ac_s}</span>
          </div>
          <div className="big" style={{ marginTop: 10 }}>
            15<span style={{ fontSize: 18 }}>%</span>
          </div>
          <div className="gbar" aria-label="15% on a 0 to 30% scale, threshold 5%">
            <span className="thr" style={{ left: "16.6%" }} />
            <span className="tick" style={{ left: "50%" }} />
          </div>
          <div className="gscale">
            <span>0%</span>
            <span>{r.thr}</span>
            <span>15%</span>
            <span>30%</span>
          </div>
        </div>

        {/* Document flag: Khatiyan */}
        <div className="tile c2" style={{ padding: 12 }}>
          <div className="t-h" style={{ fontSize: 13 }}>
            Khatiyan
          </div>
          <div className="thumb" />
          <div className="flag">
            <i>!</i>
            <span>{r.fl_1}</span>
          </div>
        </div>

        {/* Document flag: Jamabandi */}
        <div className="tile c2" style={{ padding: 12 }}>
          <div className="t-h" style={{ fontSize: 13 }}>
            Jamabandi
          </div>
          <div className="thumb j" />
          <div className="flag">
            <i>!</i>
            <span>{r.fl_2}</span>
          </div>
        </div>

        {/* Secondary metric column */}
        <div className="c5" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignContent: "start" }}>
          {/* Case progress */}
          <div className="tile" style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div className="t-h">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 4h14v16H5z" fill="currentColor" />
                </svg>
                <span>{r.prog_h}</span>
              </div>
              <div>
                <div className="big" id="stepBig">
                  {stepCount}
                  <span style={{ fontSize: 18, color: "var(--ink-3)" }}>/5</span>
                </div>
                <div className="t-sub" id="stepNote">
                  {isHi
                    ? diffsLeft
                      ? `${diffsLeft} अंतर देखने बाकी`
                      : "अब अगला कदम चुनें"
                    : diffsLeft
                    ? `${diffsLeft} difference${diffsLeft > 1 ? "s" : ""} left to review`
                    : "Ready to choose a next step"}
                </div>
              </div>
            </div>

            <div id="tasks">
              <button
                type="button"
                className="task"
                onClick={() => {
                  setOpenDiffs((o) => ({ ...o, area: true }));
                  const el = document.getElementById("differences");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="row">
                  <h3>{isHi ? "रकबे का अंतर" : "Area difference"}</h3>
                  <span className={`pill ${reviewed.area ? "done" : ""}`}>
                    {reviewed.area ? r.ok : r.todo}
                  </span>
                </div>
                <p>{isHi ? "पुराना बनाम सर्वे" : "Historical vs survey"}</p>
              </button>

              <button
                type="button"
                className="task"
                onClick={() => {
                  setOpenDiffs((o) => ({ ...o, name: true }));
                  const el = document.getElementById("differences");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="row">
                  <h3>{isHi ? "रैयत का नाम" : "Holder name"}</h3>
                  <span className={`pill ${reviewed.name ? "done" : ""}`}>
                    {reviewed.name ? r.ok : r.todo}
                  </span>
                </div>
                <p>{isHi ? "खतियान बनाम जमाबंदी" : "Khatiyan vs Jamabandi"}</p>
              </button>
            </div>
          </div>

          {/* Holders gauge */}
          <div className="tile">
            <div className="t-h">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" fill="currentColor" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6z" fill="currentColor" />
              </svg>
              <span>{r.hold_h}</span>
            </div>
            <svg className="gauge" viewBox="0 0 200 120" aria-label="1 holder recorded">
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0" stopColor="#7DC242" />
                  <stop offset=".5" stopColor="#D9E33B" />
                  <stop offset=".75" stopColor="#F2A23A" />
                  <stop offset="1" stopColor="#E5483B" />
                </linearGradient>
              </defs>
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#g1)" strokeWidth="8" strokeLinecap="round" />
              <line x1="100" y1="100" x2="100" y2="22" stroke="var(--ink)" strokeWidth="2.5" />
              <text x="100" y="86" textAnchor="middle" fontSize="10" fill="var(--ink-3)">
                {r.hold_s}
              </text>
              <text x="100" y="114" textAnchor="middle" fontSize="28" fontWeight="300">
                1
              </text>
            </svg>
            <div className="t-sub" style={{ textAlign: "center" }}>
              {r.hold_p}
            </div>
          </div>

          {/* Area gauge */}
          <div className="tile">
            <div className="t-h" style={{ justifyContent: "space-between" }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 18 L8 6 L16 8 L21 18 Z" fill="currentColor" />
                </svg>
                <span>{r.area_h}</span>
              </span>
            </div>
            <ul className="legend-mini" style={{ marginTop: 8 }}>
              <li>
                <i style={{ background: "var(--hist)" }} />
                <span>{r.lg_hist}</span>
                <b>1.20</b>
              </li>
              <li>
                <i style={{ background: "var(--surv)" }} />
                <span>{r.lg_surv}</span>
                <b>1.02</b>
              </li>
              <li>
                <i style={{ background: "var(--ink-3)" }} />
                <span>{r.lg_map}</span>
                <b>1.0243</b>
              </li>
            </ul>
            <svg className="gauge" viewBox="0 0 200 104" aria-label="Survey area 1.02 acre">
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#g1)" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 3" />
              <text x="100" y="78" textAnchor="middle" fontSize="10" fill="var(--ink-3)">
                {r.acres}
              </text>
              <text x="100" y="100" textAnchor="middle" fontSize="26" fontWeight="300">
                1.02
              </text>
            </svg>
          </div>

          {/* Field match chart */}
          <div className="tile" style={{ gridColumn: "span 2" }}>
            <div className="t-h" style={{ justifyContent: "space-between" }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="2.5" fill="none" />
                </svg>
                <span>{r.fm_h}</span>
              </span>
              <span style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--ink-3)" }}>
                <span>
                  <i style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--lime)", marginRight: 5 }} />
                  <span>{r.agree}</span>
                </span>
                <span>
                  <i style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--bad)", marginRight: 5 }} />
                  <span>{r.differ}</span>
                </span>
              </span>
            </div>
            <div className="big" style={{ fontSize: 34, textAlign: "center", marginTop: 4 }}>
              2<span style={{ fontSize: 16, color: "var(--ink-3)" }}> / 4</span>
            </div>
            <div className="t-sub" style={{ textAlign: "center" }}>
              {r.fm_s}
            </div>
            <div className="chart" aria-label="Area: 2 sources agree, 1 differs. Holder: 1 agrees, 1 differs. Khata: 3 agree. Khesra: 3 agree.">
              <div className="col">
                <span style={{ height: "62%", background: "var(--lime)" }} />
                <span style={{ height: "31%", background: "var(--bad)" }} />
              </div>
              <div className="col">
                <span style={{ height: "31%", background: "var(--lime)" }} />
                <span style={{ height: "31%", background: "var(--bad)" }} />
              </div>
              <div className="col">
                <span style={{ height: "93%", background: "var(--lime)" }} />
                <span style={{ height: "2%", background: "var(--bad)" }} />
              </div>
              <div className="col">
                <span style={{ height: "93%", background: "var(--lime)" }} />
                <span style={{ height: "2%", background: "var(--bad)" }} />
              </div>
            </div>
            <div className="chart-x">
              <span>{r.area_h}</span>
              <span>{r.holder}</span>
              <span>Khata</span>
              <span>Khesra</span>
            </div>
          </div>
        </div>

        {/* Interactive Case Map */}
        <PaintedScene mode="case" caseId={caseId} />
      </div>

      {/* Differences Accordion Panel */}
      <div id="differences" className="panel" style={{ marginTop: 14 }}>
        <h2>{r.d_h}</h2>
        <p className="t-sub" style={{ margin: "4px 0 0" }}>
          {r.d_sub}
        </p>

        {/* Area difference */}
        <div className="diff" data-id="area">
          <button
            type="button"
            aria-expanded={openDiffs.area}
            onClick={() => setOpenDiffs((o) => ({ ...o, area: !o.area }))}
          >
            <span>
              <h3>{r.d1_h}</h3>
              <p>{r.d1_p}</p>
            </span>
            <span className={`pill ${reviewed.area ? "done" : ""}`}>
              {reviewed.area ? r.ok : r.todo}
            </span>
            <svg className="chev" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <div className={`body ${openDiffs.area ? "open" : ""}`}>
            <div className="sbs">
              <div>
                <small>Historical Khatiyan-style record, row 3</small>
                <b>1.20 acre</b>
                <q>Rakba: 1 acre 20 decimal</q>
              </div>
              <div>
                <small>Survey entry, plot DEMO-456</small>
                <b>1.02 acre</b>
                <q>Area (computed): 1.02 ac</q>
              </div>
            </div>
            <p className="disc">{r.disc}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className={`btn2 ${reviewed.area ? "" : "lime"}`}
                onClick={() => toggleReview("area")}
              >
                {reviewed.area ? r.undo : r.mark}
              </button>
              <Link className="link" href={`/cases/${caseId}/verification`} style={{ marginTop: 0 }}>
                {isHi ? "सत्यापन विवरण और एंकर देखें" : "View verification & cryptographic anchor"}
              </Link>
            </div>
          </div>
        </div>

        {/* Name spelling difference */}
        <div className="diff" data-id="name">
          <button
            type="button"
            aria-expanded={openDiffs.name}
            onClick={() => setOpenDiffs((o) => ({ ...o, name: !o.name }))}
          >
            <span>
              <h3>{r.d2_h}</h3>
              <p>{r.d2_p}</p>
            </span>
            <span className={`pill ${reviewed.name ? "done" : ""}`}>
              {reviewed.name ? r.ok : r.todo}
            </span>
            <svg className="chev" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <div className={`body ${openDiffs.name ? "open" : ""}`}>
            <div className="sbs">
              <div>
                <small>Historical Khatiyan-style record</small>
                <b>Ramesh Prasad Singh</b>
                <q>Raiyat: Ramesh Prasad Singh</q>
              </div>
              <div>
                <small>Current Jamabandi-like record</small>
                <b>Ramesh Pd. Singh</b>
                <q>Name: Ramesh Pd. Singh</q>
              </div>
            </div>
            <p className="disc">{r.disc2}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className={`btn2 ${reviewed.name ? "" : "lime"}`}
                onClick={() => toggleReview("name")}
              >
                {reviewed.name ? r.undo : r.mark}
              </button>
              <Link className="link" href={`/cases/${caseId}/family`} style={{ marginTop: 0 }}>
                {isHi ? "पारिवारिक वंशावली देखें" : "View family genealogy"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Folded Evidence Map */}
      <FoldedEvidenceMap
        onToast={triggerToast}
        onScrollToDifferences={() => {
          setOpenDiffs((o) => ({ ...o, area: true }));
          const el = document.getElementById("differences");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Documents Panel */}
      <div id="documents" className="panel" style={{ marginTop: 14 }}>
        <h2>{r.doc_h}</h2>
        <p className="t-sub" style={{ margin: "4px 0 10px" }}>
          {r.doc_sub}
        </p>
        <div className="grid">
          <div className="tile c4 doc">
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h9l4 4v14H6z M8 11h8 M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <span>
              <b>Khatiyan-style record</b>
              <small>
                <span>{r.extracted}</span>: 6
              </small>
            </span>
            <Link className="pill done" href={`/cases/${caseId}/documents`} style={{ textDecoration: "none" }}>
              {r.inspect}
            </Link>
          </div>

          <div className="tile c4 doc">
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h9l4 4v14H6z M8 11h8 M8 15h8" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <span>
              <b>Jamabandi-like record</b>
              <small>
                <span>{r.extracted}</span>: 5
              </small>
            </span>
            <Link className="pill done" href={`/cases/${caseId}/documents`} style={{ textDecoration: "none" }}>
              {r.inspect}
            </Link>
          </div>

          <div className="tile c4 doc">
            <span className="ic">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <span>
              <b>Survey entry and map</b>
              <small>
                <span>{r.extracted}</span>: 4
              </small>
            </span>
            <Link className="pill done" href={`/cases/${caseId}/documents`} style={{ textDecoration: "none" }}>
              {r.inspect}
            </Link>
          </div>
        </div>

        {/* Deeper features quick-access shelf */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="t-sub" style={{ marginRight: 6 }}>
            {isHi ? "गहन अन्वेषण:" : "Deep inspection:"}
          </span>
          <Link className="chip" href={`/cases/${caseId}/documents`}>
            📄 {isHi ? "दस्तावेज़ निष्कर्षण" : "Document Extractor"}
          </Link>
          <Link className="chip" href={`/cases/${caseId}/parcel-intelligence`}>
            🗺️ {isHi ? "भू-खंड विश्लेषण" : "Parcel Intelligence"}
          </Link>
          <Link className="chip" href={`/cases/${caseId}/official-records`}>
            🏛️ {isHi ? "सरकारी रिकॉर्ड खोज" : "Official Records"}
          </Link>
          <Link className="chip" href={`/cases/${caseId}/earth-observation`}>
            🛰️ {isHi ? "उपग्रह अवलोकन" : "Earth Observation"}
          </Link>
          <Link className="chip" href={`/cases/${caseId}/family`}>
            👥 {isHi ? "पारिवारिक वंशावली" : "Family Tree"}
          </Link>
          <Link className="chip" href={`/cases/${caseId}/next-action`}>
            🧭 {isHi ? "अगला कदम" : "Next Action"}
          </Link>
          <Link className="chip" href={`/cases/${caseId}/review-packet`}>
            📦 {isHi ? "समीक्षा पैकेट" : "Review Packet"}
          </Link>
        </div>

        <p style={{ marginTop: 14 }}>
          <button type="button" className="btn2" id="reset" onClick={handleReset}>
            {r.reset}
          </button>
        </p>
      </div>
    </section>
  );
}

export default function Dashboard() {
  return (
    <CasePage>
      {(detail, caseId) => <CaseDashboardContent detail={detail} caseId={caseId} />}
    </CasePage>
  );
}
