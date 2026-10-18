"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/locale-context";
import { redesignI18n } from "@/lib/i18n";

export default function Home() {
  const { locale } = useLocale();
  const r = redesignI18n[locale] || redesignI18n.en;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    document.body.classList.add("on-home");
    const reduce =
      typeof window !== "undefined" &&
      !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const timer = setTimeout(() => {
      setRevealed(true);
    }, reduce ? 0 : 1700);

    return () => {
      document.body.classList.remove("on-home");
      clearTimeout(timer);
    };
  }, []);

  return (
    <section id="v-home" className="view on">
      <div className="grid">
        <div className={`c12 hero ${revealed ? "revealed" : ""}`}>
          <div className="hero-panel">
            <h1>{r.hero_h}</h1>
            <p>{r.hero_p}</p>
            <div className="ctas">
              <Link className="cta" href="/cases/demo-family-001">
                {r.cta_demo}
              </Link>
              <Link className="chip" id="newcase" href="/create-case">
                {r.cta_new}
              </Link>
            </div>
            <p className="fine">{r.hero_fine}</p>
          </div>
        </div>

        <div className="tile c4">
          <div className="t-h">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="var(--ok)" />
            </svg>
            <span>{r.does_h}</span>
          </div>
          <ul className="list">
            <li>{r.does_1}</li>
            <li>{r.does_2}</li>
            <li>{r.does_3}</li>
          </ul>
        </div>

        <div className="tile c4">
          <div className="t-h">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="var(--bad)" />
            </svg>
            <span>{r.dont_h}</span>
          </div>
          <ul className="list no">
            <li>{r.dont_1}</li>
            <li>{r.dont_2}</li>
            <li>{r.dont_3}</li>
          </ul>
        </div>

        <div className="tile c4">
          <div className="t-h">
            <span>{r.for_h}</span>
          </div>
          <p className="t-sub" style={{ margin: "8px 0 0", fontSize: 13 }}>
            {r.for_p}
          </p>
        </div>

        <Link
          className="tile c3"
          href="/cases/demo-family-001"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="step-n">1</div>
          <h3 style={{ marginTop: 14, fontWeight: 400 }}>{r.s1_h}</h3>
          <p className="t-sub">{r.s1_p}</p>
        </Link>

        <Link
          className="tile c3"
          href="/cases/demo-family-001/documents"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="step-n">2</div>
          <h3 style={{ marginTop: 14, fontWeight: 400 }}>{r.s2_h}</h3>
          <p className="t-sub">{r.s2_p}</p>
        </Link>

        <Link
          className="tile c3"
          href="/cases/demo-family-001#differences"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="step-n">3</div>
          <h3 style={{ marginTop: 14, fontWeight: 400 }}>{r.s3_h}</h3>
          <p className="t-sub">{r.s3_p}</p>
        </Link>

        <Link
          className="tile c3"
          href="/cases/demo-family-001/next-action"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="step-n">4</div>
          <h3 style={{ marginTop: 14, fontWeight: 400 }}>{r.s4_h}</h3>
          <p className="t-sub">{r.s4_p}</p>
        </Link>
      </div>
    </section>
  );
}
