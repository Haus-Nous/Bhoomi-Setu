import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./verification.css";
import "./guidance.css";
import "./locale.css";
import "./earth-observation.css";
import { CaseProvider } from "@/components/case-context";
import { LocaleProvider } from "@/components/locale-context";
import { Notice, SiteFooter, SiteHeader } from "@/components/shell";
export const metadata: Metadata = { title: { default: "BhoomiCheck | Understand your land record", template: "%s | BhoomiCheck" }, description: "Independent synthetic prototype for inspecting traceable land-record differences before taking action.", applicationName: "BhoomiCheck" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><LocaleProvider><CaseProvider><SiteHeader /><Notice />{children}<SiteFooter /></CaseProvider></LocaleProvider></body></html>; }
