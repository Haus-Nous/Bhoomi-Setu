"use client";

import Link from "next/link";
import { DemoResetButton } from "@/components/demo-reset-button";
import { NextActionCard } from "@/components/domain";
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

  return <main id="main"><section className="hero"><div><p className="eyebrow">{c.home.eyebrow}</p><h1>{c.home.title}</h1><p className="lead">{c.home.lead}</p><div className="actions"><Link className="button" href="/cases/demo-family-001">{c.cta.exploreDemo}</Link><Link className="button secondary" href="/create-case">{c.home.createTitle}</Link></div><p className="micro">{c.home.safety}</p></div><aside className="hero-card"><p className="eyebrow">{c.home.start}</p><ol><li><b>1</b>{c.home.step1}</li><li><b>2</b>{c.home.step2}</li><li><b>3</b>{c.home.step3}</li><li><b>4</b>{c.home.step4}</li></ol><dl className="hero-proof-facts"><div><dt>Khata / Khesra</dt><dd>DEMO-128 / DEMO-456</dd></div><div><dt>{experience.landing.historical}</dt><dd>1.20 acre</dd></div><div><dt>{experience.landing.survey}</dt><dd>1.02 acre</dd></div><div><dt>{experience.landing.mapped}</dt><dd>1.0243 acre</dd></div><div><dt>{experience.landing.result}</dt><dd>{experience.landing.resultValue}</dd></div></dl><DemoResetButton /><Link className="compact-action" href="/cases/demo-family-002/verification">{c.cta.viewControl} <span aria-hidden>→</span></Link></aside></section><section className="section product-proof" aria-labelledby="product-proof-title"><p className="eyebrow">{experience.landing.eyebrow}</p><h2 id="product-proof-title">{experience.landing.title}</h2><div className="product-proof-grid">{proofPoints.map(([title, detail]) => <article key={title}><h3>{title}</h3><p>{detail}</p></article>)}</div></section><section className="section two-col"><div><p className="eyebrow">{c.home.forWho}</p><h2>{c.home.forWhoTitle}</h2><p>{c.home.forWhoDetail}</p></div><div className="callout"><strong>{c.home.does}</strong><p>{c.home.doesDetail}</p><strong>{c.home.doesNot}</strong><p>{c.home.doesNotDetail}</p></div></section><section id="how-it-works" className="section"><p className="eyebrow">{c.cta.how}</p><h2>{c.home.howTitle}</h2><div className="action-grid"><NextActionCard href="/cases/demo-family-001" title={c.cta.exploreDemo} detail={c.home.verifyDetail} /><NextActionCard href="/cases/demo-family-001/documents" title={c.home.documentsTitle} detail={c.home.documentsDetail} /><NextActionCard href="/cases/demo-family-001/verification" title={c.home.verifyTitle} detail={c.home.verifyDetail} /></div></section></main>;
}
