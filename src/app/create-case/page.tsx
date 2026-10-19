"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCaseActions } from "@/components/case-context";
import { useLocale, useTranslation } from "@/components/locale-context";

export default function CreateCase() {
  const { createCase } = useCaseActions();
  const router = useRouter();
  const { locale } = useLocale();
  const c = useTranslation().create;
  const labels = useTranslation().labels;
  const isHi = locale === "hi";

  const [district, setDistrict] = useState("");
  const [circle, setCircle] = useState("");
  const [village, setVillage] = useState("");
  const [khata, setKhata] = useState("");
  const [khesra, setKhesra] = useState("");
  const [nickname, setNickname] = useState("");

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const errorDescription = error ? "create-case-error" : undefined;

  function handleFillDemo() {
    setDistrict(isHi ? "डेमो ज़िला" : "Demo District");
    setCircle(isHi ? "डेमो अंचल" : "Demo Circle");
    setVillage(isHi ? "उदाहरण मौजा A" : "Example Mauza A");
    setKhata("DEMO-128");
    setKhesra("DEMO-456");
    setNickname(isHi ? "डेमो कृषि केस" : "Demo Farm Case");
    setError("");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const d = district.trim();
    const cir = circle.trim();
    const v = village.trim();
    let kh = khata.trim();
    let khs = khesra.trim();
    let nick = nickname.trim();

    if (!d || !cir || !v || !kh || !nick) {
      setError(c.missing);
      return;
    }

    // Auto-normalize Khata to DEMO- format if needed
    if (!/^DEMO-/i.test(kh)) {
      kh = `DEMO-${kh.toUpperCase().replace(/[^A-Z0-9-]/g, "")}`;
    }

    // Auto-normalize Khesra if provided
    if (khs && !/^DEMO-/i.test(khs)) {
      khs = `DEMO-${khs.toUpperCase().replace(/[^A-Z0-9-]/g, "")}`;
    }

    // Ensure labels meet synthetic demo requirement if user typed plain names
    const demoPattern = /\b(demo|sample|example|synthetic|fictional)\b|(?:डेमो|उदाहरण|सिंथेटिक|काल्पनिक)/i;
    const ensureDemo = (val: string) => (demoPattern.test(val) ? val : `${val} (Demo)`);

    const finalDistrict = ensureDemo(d);
    const finalCircle = ensureDemo(cir);
    const finalVillage = ensureDemo(v);
    const finalNickname = ensureDemo(nick);

    setPending(true);
    setError("");

    try {
      const item = await createCase({
        district: finalDistrict,
        circle: finalCircle,
        village: finalVillage,
        khata: kh,
        khesra: khs || undefined,
        nickname: finalNickname,
      });
      router.push(`/cases/${item.case.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : c.serverError;
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main id="main" className="narrow" style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
      <header className="page-intro" style={{ marginBottom: 24 }}>
        <p className="eyebrow">{c.step}</p>
        <h1 style={{ fontSize: 28, margin: "8px 0" }}>{c.title}</h1>
        <p style={{ color: "var(--ink-2)", fontSize: 15 }}>{c.intro}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleFillDemo}
            className="chip"
            style={{ cursor: "pointer", background: "var(--paper-2)", border: "1px solid var(--line)" }}
          >
            ⚡ {isHi ? "डेमो जानकारी भरें (1-क्लिक)" : "Fill sample demo values (1-click)"}
          </button>
          <Link
            href="/cases/demo-family-001"
            className="chip"
            style={{ textDecoration: "none", color: "inherit", background: "var(--paper-2)", border: "1px solid var(--line)" }}
          >
            📁 {isHi ? "या पहले से बना डेमो केस 001 खोलें" : "Or open preloaded Demo Case 001"} →
          </Link>
        </div>
      </header>

      <form onSubmit={submit} className="form-card" noValidate>
        <fieldset>
          <legend>{c.location}</legend>
          <label>
            {c.district}
            <input
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              autoComplete="address-level1"
              placeholder={c.districtPlaceholder}
              required
              aria-describedby={errorDescription}
            />
          </label>
          <label>
            {c.circle}
            <input
              name="circle"
              value={circle}
              onChange={(e) => setCircle(e.target.value)}
              placeholder={c.circlePlaceholder}
              required
              aria-describedby={errorDescription}
            />
          </label>
          <label>
            {c.village}
            <input
              name="village"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder={c.villagePlaceholder}
              required
              aria-describedby={errorDescription}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>{c.record}</legend>
          <label>
            {c.khata}
            <input
              name="khata"
              value={khata}
              onChange={(e) => setKhata(e.target.value)}
              placeholder={c.khataPlaceholder}
              required
              aria-describedby={errorDescription ? `khata-help ${errorDescription}` : "khata-help"}
            />
          </label>
          <p id="khata-help" className="micro">
            {c.khataHelp}
          </p>
          <label>
            {c.khesra} <span className="optional">{labels.optional}</span>
            <input
              name="khesra"
              value={khesra}
              onChange={(e) => setKhesra(e.target.value)}
              placeholder={c.khesraPlaceholder}
            />
          </label>
          <label>
            {c.nickname}
            <input
              name="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={c.nicknamePlaceholder}
              required
              aria-describedby={errorDescription}
            />
          </label>
        </fieldset>

        {error && (
          <p id="create-case-error" className="form-error" role="alert" style={{ color: "var(--bad)", marginTop: 12 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 18, alignItems: "center" }}>
          <button className="cta" type="submit" disabled={pending} style={{ border: "none", cursor: "pointer" }}>
            {pending ? c.creating : c.submit}
          </button>
        </div>

        <p className="micro" style={{ marginTop: 14 }}>
          {c.safety}
        </p>
      </form>
    </main>
  );
}

