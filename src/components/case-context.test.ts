import { describe, expect, it } from "vitest";
import { shouldLoadCase } from "@/components/case-context";

describe("case loading guard", () => {
  it("does not restart an in-flight case request", () => {
    expect(shouldLoadCase({ status: "loading" }, "en")).toBe(false);
  });

  it("loads missing cases and refreshes only ready cases whose locale changed", () => {
    expect(shouldLoadCase(undefined, "en")).toBe(true);
    expect(shouldLoadCase({ status: "ready", detail: {} as never, locale: "en" }, "en")).toBe(false);
    expect(shouldLoadCase({ status: "ready", detail: {} as never, locale: "en" }, "hi")).toBe(true);
  });
});
