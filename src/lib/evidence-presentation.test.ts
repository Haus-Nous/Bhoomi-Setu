import { describe, expect, it } from "vitest";
import { groupCaseEvidence } from "@/lib/evidence-presentation";
import type { DocumentItem } from "@/types/case";

const document = (id: string): DocumentItem => ({
  id,
  title: id,
  kind: "legacy-record",
  type: "Synthetic record",
  addedLabel: "Synthetic",
  state: "extracted",
  fields: [],
  sourceText: "Synthetic only",
  isSynthetic: true,
});

describe("case evidence presentation", () => {
  it("keeps seeded core evidence ahead of optional fixture material without changing document data", () => {
    const core = document("demo-family-001-historical");
    const fixture = document("demo-family-001-fixture-legacy-a");
    const grouped = groupCaseEvidence([core, fixture]);

    expect(grouped).toEqual({ core: [core], supporting: [fixture] });
    expect(core.state).toBe("extracted");
    expect(fixture.isSynthetic).toBe(true);
  });
});
