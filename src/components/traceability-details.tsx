import type { ReactNode } from "react";

export function TraceabilityDetails({
  summary,
  children,
  className = "",
}: {
  summary: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`traceability-details ${className}`.trim()}>
      <summary>{summary}</summary>
      <div className="traceability-content">{children}</div>
    </details>
  );
}
