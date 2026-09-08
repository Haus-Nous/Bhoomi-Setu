import { describe, expect, it } from "vitest";
import { caseNavigationSections } from "@/components/shell";

describe("case navigation sections", () => {
  it("keeps the core workflow primary and exposes contextual routes with the same case id", () => {
    const sections = caseNavigationSections("demo-family-001");
    expect(sections.primary.map((item) => item.key)).toEqual(["dashboard", "documents", "verification", "survey", "action"]);
    expect(sections.context.map((item) => item.key)).toEqual(["family", "parcel", "official", "earth", "timeline"]);
    expect([...sections.primary, ...sections.context].every((item) => item.href.startsWith("/cases/demo-family-001"))).toBe(true);
    expect(sections.context.find((item) => item.key === "earth")?.href).toBe("/cases/demo-family-001/earth-observation");
  });
});
