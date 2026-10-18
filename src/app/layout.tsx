import type { Metadata, Viewport } from "next";
import { Outfit, Noto_Sans_Devanagari, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./redesign.css";
import "./verification.css";
import "./guidance.css";
import "./locale.css";
import "./earth-observation.css";
import { CaseProvider } from "@/components/case-context";
import { LocaleProvider } from "@/components/locale-context";
import { AppShell } from "@/components/shell";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["300", "400", "500"],
  variable: "--font-devanagari",
  display: "swap",
});

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
  title: { default: "BhoomiSetu — Understand your land record", template: "%s | BhoomiSetu" },
  description: "BhoomiSetu reads your Khatiyan, Jamabandi and survey papers, lines up what each one says, and shows you where they disagree, with the exact source for every number.",
  applicationName: "BhoomiSetu",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${notoSansDevanagari.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <LocaleProvider>
          <CaseProvider>
            <AppShell>{children}</AppShell>
          </CaseProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
