"use client";

import Link from "next/link";
import { DemoResetButton } from "@/components/demo-reset-button";
import { NextActionCard } from "@/components/domain";
import { GlobeHero } from "@/components/globe-hero";
import { useLocale, useTranslation } from "@/components/locale-context";
import { localizedExperiencePresentation } from "@/lib/i18n";

export default function Home() {
  const c = useTranslation();
  const { locale } = useLocale();
  const experience = localizedExperiencePresentation(locale);
  const proofPoints = [
    [experience.landing.document, experience.landing.documentDetail],
    [experience.landing.verification, experience.landing.verificationDetail],
    [experience.landing.parcel, experience.landing.parcelDetail],
    [experience.landing.guidance, experience.landing.guidanceDetail],
  ];

  return (
    <main id="main" className="landing-main">
      {/* 1. TRUST SURFACE: Hero with Globe & Verifiable Evidence */}
      <section className="hero-surface-wrap" aria-label="Hero">
        <div className="hero-container">
          <div className="hero-copy-column">
            <p className="hero-eyebrow">{c.home.trustEyebrow}</p>
            <h1>{c.home.title}</h1>
            <p className="lead">{c.home.lead}</p>
            <div className="actions">
              <Link className="button" href="/cases/demo-family-001">
                {c.cta.exploreDemo}
              </Link>
              <Link className="button secondary" href="/create-case">
                {c.home.createTitle}
              </Link>
            </div>
            <p className="micro">{c.home.safety}</p>
          </div>

          <div className="hero-visual-column">
            <GlobeHero />
            <aside className="hero-card trust-card" aria-label={c.home.start}>
              <p className="eyebrow">{c.home.start}</p>
              <ol className="hero-steps">
                <li><b>1</b> {c.home.step1}</li>
                <li><b>2</b> {c.home.step2}</li>
                <li><b>3</b> {c.home.step3}</li>
                <li><b>4</b> {c.home.step4}</li>
              </ol>
              <dl className="hero-proof-facts">
                <div>
                  <dt>Khata / Khesra</dt>
                  <dd>DEMO-128 / DEMO-456</dd>
                </div>
                <div>
                  <dt>{experience.landing.historical}</dt>
                  <dd>1.20 acre</dd>
                </div>
                <div>
                  <dt>{experience.landing.survey}</dt>
                  <dd>1.02 acre</dd>
                </div>
                <div>
                  <dt>{experience.landing.mapped}</dt>
                  <dd>1.0243 acre</dd>
                </div>
                <div>
                  <dt>{experience.landing.result}</dt>
                  <dd>{experience.landing.resultValue}</dd>
                </div>
              </dl>
              <div className="hero-card-actions">
                <DemoResetButton />
                <Link className="compact-action" href="/cases/demo-family-002/verification">
                  {c.cta.viewControl} <span aria-hidden>→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 2. WORKING SURFACE: Evidence & Capabilities */}
      <section className="section product-proof" aria-labelledby="product-proof-title">
        <div className="section-container">
          <p className="eyebrow">{experience.landing.eyebrow}</p>
          <h2 id="product-proof-title">{experience.landing.title}</h2>
          <div className="product-proof-grid">
            {proofPoints.map(([title, detail]) => (
              <article key={title} className="product-proof-card">
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. NARRATIVE SURFACE: Problem framing on warm paper */}
      <section className="narrative-surface" aria-labelledby="narrative-heading">
        <div className="narrative-container">
          <p className="eyebrow">{c.home.forWho}</p>
          <h2 id="narrative-heading">{c.home.forWhoTitle}</h2>
          <p className="narrative-body">{c.home.forWhoDetail}</p>
          <div className="narrative-columns">
            <div className="narrative-block">
              <h3>{c.home.does}</h3>
              <p>{c.home.doesDetail}</p>
            </div>
            <div className="narrative-block">
              <h3>{c.home.doesNot}</h3>
              <p>{c.home.doesNotDetail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKING SURFACE: Guided Path */}
      <section id="how-it-works" className="section how-it-works-section" aria-labelledby="how-heading">
        <div className="section-container">
          <p className="eyebrow">{c.cta.how}</p>
          <h2 id="how-heading">{c.home.howTitle}</h2>
          <div className="action-grid">
            <NextActionCard href="/cases/demo-family-001" title={c.cta.exploreDemo} detail={c.home.verifyDetail} />
            <NextActionCard href="/cases/demo-family-001/documents" title={c.home.documentsTitle} detail={c.home.documentsDetail} />
            <NextActionCard href="/cases/demo-family-001/verification" title={c.home.verifyTitle} detail={c.home.verifyDetail} />
          </div>
        </div>
      </section>
    </main>
  );
}

