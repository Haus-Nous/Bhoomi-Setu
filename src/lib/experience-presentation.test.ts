import { describe, expect, it } from "vitest";
import { localizedExperiencePresentation } from "@/lib/i18n";

describe("experience presentation localization", () => {
  it("localizes product proof, evidence hierarchy, and traceability copy", () => {
    const english = localizedExperiencePresentation("en");
    const hindi = localizedExperiencePresentation("hi");

    expect(english.landing.title).toBe("A working evidence-led demo");
    expect(english.documents.reviewVerification).toBe("Review verification");
    expect(hindi.documents.core).toBe("मुख्य रिकॉर्ड");
    expect(hindi.traceability).toContain("ट्रेसबिलिटी");
  });
});
