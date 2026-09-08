"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/locale-context";

export function DemoResetButton({ caseId = "demo-family-001" }: { caseId?: "demo-family-001" | "demo-family-002" }) {
  const c = useTranslation();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [resetting, setResetting] = useState(false);

  const reset = async () => {
    setResetting(true);
    setMessage("");
    try {
      const response = await fetch("/api/demo/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId }) });
      if (!response.ok) throw new Error();
      router.push(`/cases/${caseId}`);
    } catch {
      setMessage(c.caseStates.errorDetail);
      setResetting(false);
    }
  };

  return <div className="demo-reset"><button type="button" className="button secondary small" disabled={resetting} onClick={() => void reset()}>{resetting ? c.caseStates.loading : c.cta.resetDemo}</button>{message && <p role="status" className="micro">{message}</p>}</div>;
}
