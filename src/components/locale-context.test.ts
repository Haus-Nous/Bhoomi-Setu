import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, readPersistedLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";

describe("locale hydration contract", () => {
  it("uses one deterministic locale for SSR and the first client render", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(t(DEFAULT_LOCALE).labels.skip).toBe("Skip to content");
    expect(LOCALE_STORAGE_KEY).toBe("bhoomi-check-locale");
  });
  it("recognizes a persisted locale only for post-mount restoration", () => {
    expect(readPersistedLocale("hi")).toBe("hi");
    expect(readPersistedLocale("en")).toBe("en");
    expect(readPersistedLocale("anything-else")).toBeNull();
    expect(readPersistedLocale(null)).toBeNull();
  });
});
