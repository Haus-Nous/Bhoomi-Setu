"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslation } from "@/components/locale-context";

const defaultCaseId = "demo-family-001";

type CaseNavigationKey = "dashboard" | "documents" | "family" | "verification" | "survey" | "parcel" | "official" | "earth" | "action" | "timeline";
type CaseNavigationLink = { key: CaseNavigationKey; href: string };

export const caseNavigationSections = (caseId: string): { primary: CaseNavigationLink[]; context: CaseNavigationLink[] } => ({
  primary: [
    { key: "dashboard", href: `/cases/${caseId}` },
    { key: "documents", href: `/cases/${caseId}/documents` },
    { key: "verification", href: `/cases/${caseId}/verification` },
    { key: "survey", href: `/cases/${caseId}/survey-record` },
    { key: "action", href: `/cases/${caseId}/next-action` },
  ],
  context: [
    { key: "family", href: `/cases/${caseId}/family` },
    { key: "parcel", href: `/cases/${caseId}/parcel-intelligence` },
    { key: "official", href: `/cases/${caseId}/official-records` },
    { key: "earth", href: `/cases/${caseId}/earth-observation` },
    { key: "timeline", href: `/cases/${caseId}/timeline` },
  ],
});

export function SiteHeader() {
  const c = useTranslation();
  const { locale, setLocale } = useLocale();
  return <><a className="skip" href="#main">{c.labels.skip}</a><header className="site-header"><Link href="/" className="brand" aria-label={c.labels.homeLabel}><span className="brand-mark" aria-hidden>⌂</span><span>Bhoomi<span>Check</span></span></Link><nav aria-label={c.labels.primaryNav}><button type="button" className="locale-switch" aria-label={c.labels.chooseLanguage} aria-pressed={locale === "hi"} onClick={() => setLocale(locale === "en" ? "hi" : "en")}>{locale === "en" ? "हिंदी" : "English"}</button><Link href={`/cases/${defaultCaseId}`}>{c.nav.dashboard}</Link><Link className="button small" href="/create-case">{c.cta.check}</Link></nav></header></>;
}

function CaseNavigationLinks({ links, pathname, c }: { links: CaseNavigationLink[]; pathname: string; c: ReturnType<typeof useTranslation> }) {
  return <>{links.map(({ key, href }) => <Link key={key} className={pathname === href ? "active" : ""} href={href} aria-current={pathname === href ? "page" : undefined}>{c.nav[key]}</Link>)}</>;
}

export function CaseNavigation({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const c = useTranslation();
  const sections = caseNavigationSections(caseId);
  const contextIsCurrent = sections.context.some(({ href }) => href === pathname);
  return <nav className="case-nav" aria-label={c.labels.caseNav}><div className="case-nav-primary"><CaseNavigationLinks links={sections.primary} pathname={pathname} c={c} /></div><details className="case-nav-context" open={contextIsCurrent}><summary>{c.labels.contextNav}</summary><div className="case-nav-context-links"><CaseNavigationLinks links={sections.context} pathname={pathname} c={c} /></div></details></nav>;
}

export function Notice() { return <p className="notice" role="note">{useTranslation().notice}</p>; }
export function SiteFooter() { return <footer>{useTranslation().footer}</footer>; }
export function CaseHeader({ title, subtitle }: { title: string; subtitle: string }) { return <header className="case-header"><p className="eyebrow">{useTranslation().labels.caseHeader}</p><h1>{title}</h1><p>{subtitle}</p></header>; }
