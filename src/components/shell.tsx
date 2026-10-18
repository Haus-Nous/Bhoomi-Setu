"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslation } from "@/components/locale-context";
import { redesignI18n } from "@/lib/i18n";
import { PaintedScene } from "@/components/painted-scene";
import React from "react";

const defaultCaseId = "demo-family-001";

type CaseNavigationKey =
  | "dashboard"
  | "documents"
  | "family"
  | "verification"
  | "survey"
  | "parcel"
  | "official"
  | "earth"
  | "action"
  | "timeline";
type CaseNavigationLink = { key: CaseNavigationKey; href: string };

export const caseNavigationSections = (
  caseId: string
): { primary: CaseNavigationLink[]; context: CaseNavigationLink[] } => ({
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

export function RailNavigation() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const isHome = pathname === "/";
  const isCase = pathname?.startsWith("/cases");
  const isCaseDashboard = pathname === `/cases/${defaultCaseId}`;

  const toggleLocale = () => {
    setLocale(locale === "en" ? "hi" : "en");
  };

  return (
    <nav className="rail" aria-label="Main">
      <Link className="logo" href="/" aria-label="BhoomiSetu home">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M3 14 L7 5 L13 6.5 L17 14 Z"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <Link href="/" className={isHome ? "cur" : ""} aria-label="Home">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor" />
        </svg>
      </Link>
      <Link
        href={`/cases/${defaultCaseId}`}
        className={isCaseDashboard ? "cur" : ""}
        aria-label="My case"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
            fill="currentColor"
          />
        </svg>
      </Link>
      <Link
        href={`/cases/${defaultCaseId}#differences`}
        className={pathname?.includes("/verification") ? "cur" : ""}
        aria-label="Differences"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 4h14v16H5z M8 9h8 M8 13h8 M8 17h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </Link>
      <Link
        href={`/cases/${defaultCaseId}#evidence`}
        className={pathname?.includes("/parcel") || pathname?.includes("/earth") ? "cur" : ""}
        aria-label="Evidence"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </Link>
      <Link
        href={`/cases/${defaultCaseId}#documents`}
        className={pathname?.includes("/documents") ? "cur" : ""}
        aria-label="Documents"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h7l2 2h9v11H3z" fill="currentColor" />
        </svg>
      </Link>
      <span className="grow" />
      <button
        type="button"
        className="ri hide-m"
        id="langR"
        aria-label="Switch language"
        style={{ fontSize: 12, fontWeight: 500 }}
        onClick={toggleLocale}
      >
        {locale === "hi" ? "En" : "हि"}
      </button>
    </nav>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const r = redesignI18n[locale] || redesignI18n.en;
  const isHome = pathname === "/";

  const toggleLocale = () => {
    setLocale(locale === "en" ? "hi" : "en");
  };

  return (
    <div className="bar">
      <Link className="bar-logo" href="/" aria-label="BhoomiSetu home">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M3 14 L7 5 L13 6.5 L17 14 Z"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      {!isHome && (
        <Link className="chip" href="/" id="back">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19 12H5m6-6l-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span className="back-t">{r.back}</span>
        </Link>
      )}
      <span className="notice">{r.notice}</span>
      <button type="button" className="chip" id="lang" onClick={toggleLocale}>
        {locale === "hi" ? "English" : "हिंदी"}
      </button>
      <Link className="cta lime bar-cta" href={`/cases/${defaultCaseId}`}>
        {r.nav_check}
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return null;
}

function CaseNavigationLinks({
  links,
  pathname,
  c,
}: {
  links: CaseNavigationLink[];
  pathname: string;
  c: ReturnType<typeof useTranslation>;
}) {
  return (
    <>
      {links.map(({ key, href }) => (
        <Link
          key={key}
          className={`chip ${pathname === href ? "active" : ""}`}
          style={{
            background: pathname === href ? "var(--lime)" : "var(--tile)",
            color: pathname === href ? "var(--lime-ink)" : "var(--ink)",
            fontWeight: pathname === href ? 500 : 400,
          }}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {c.nav[key]}
        </Link>
      ))}
    </>
  );
}

export function CaseNavigation({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const c = useTranslation();
  const sections = caseNavigationSections(caseId);
  return (
    <nav
      className="case-sub-nav"
      aria-label={c.labels.caseNav}
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        marginBottom: 16,
        padding: "8px 12px",
        background: "var(--tile-a)",
        borderRadius: "var(--r)",
      }}
    >
      <CaseNavigationLinks links={sections.primary} pathname={pathname} c={c} />
      <CaseNavigationLinks links={sections.context} pathname={pathname} c={c} />
    </nav>
  );
}

export function Notice() {
  return null;
}

export function SiteFooter() {
  const { locale } = useLocale();
  const r = redesignI18n[locale] || redesignI18n.en;
  return <footer className="bhoomi-footer">{r.foot}</footer>;
}

export function CaseHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="case-header" style={{ marginBottom: 14 }}>
      <h1 className="display-h1" style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: 0 }}>
        {title}
      </h1>
      <p className="t-sub" style={{ margin: "4px 0 0", fontSize: 13 }}>
        {subtitle}
      </p>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const r = redesignI18n[locale] || redesignI18n.en;

  return (
    <>
      <PaintedScene mode="background" />
      <div className="app">
        <div className="hero-fade" aria-hidden="true" />
        <RailNavigation />
        <main className="bhoomi-main">
          <TopBar />
          <p className="notice notice-m">{r.notice}</p>
          {children}
          <SiteFooter />
        </main>
      </div>
    </>
  );
}
