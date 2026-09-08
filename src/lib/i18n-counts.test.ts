import { describe, expect, it } from "vitest";
import { localizedPeopleCount } from "@/lib/i18n";

describe("localized people counts", () => {
  it("uses count-aware English wording", () => {
    expect(localizedPeopleCount("en", 0)).toBe("0 people noted");
    expect(localizedPeopleCount("en", 1)).toBe("1 person noted");
    expect(localizedPeopleCount("en", 2)).toBe("2 people noted");
  });

  it("uses count-aware Hindi wording", () => {
    expect(localizedPeopleCount("hi", 0)).toBe("0 लोग दर्ज हैं");
    expect(localizedPeopleCount("hi", 1)).toBe("1 व्यक्ति दर्ज है");
    expect(localizedPeopleCount("hi", 2)).toBe("2 लोग दर्ज हैं");
  });
});
