import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./verification.css";
import "./guidance.css";
import "./locale.css";
import "./earth-observation.css";
import { CaseProvider } from "@/components/case-context";
import { LocaleProvider } from "@/components/locale-context";
import { Notice, SiteFooter, SiteHeader } from "@/components/shell";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Bhoomi Setu | Understand your land record", template: "%s | Bhoomi Setu" },
  description: "Independent synthetic prototype for inspecting traceable land-record differences before taking action.",
  applicationName: "Bhoomi Setu",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body>
        <LocaleProvider>
          <CaseProvider>
            <SiteHeader />
            <Notice />
            {children}
            <SiteFooter />
          </CaseProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

