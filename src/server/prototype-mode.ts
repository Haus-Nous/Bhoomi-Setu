import type { CreateCaseInput } from "@/services/case-service";

/** The only supported deployment profile for this repository. */
export const PROTOTYPE_MODE = "synthetic-demo" as const;

const syntheticIdentifier = /^DEMO-[A-Z0-9-]+$/i;
const syntheticLabel = /\b(demo|sample|example|synthetic|fictional)\b|(?:डेमो|उदाहरण|सिंथेटिक|काल्पनिक)/i;
const prohibitedSensitivePattern = /\b(?:\d{4}[ -]?\d{4}[ -]?\d{4}|[A-Z]{5}\d{4}[A-Z]|otp|password|api[ _-]?key|token)\b/i;

export function isSyntheticIdentifier(value: string) {
  return syntheticIdentifier.test(value.trim());
}

export function isSyntheticDemoLabel(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 120 && syntheticLabel.test(trimmed) && !prohibitedSensitivePattern.test(trimmed) && !/[\\/]/.test(trimmed);
}

export function isValidSyntheticCaseInput(input: CreateCaseInput) {
  return isSyntheticIdentifier(input.khata)
    && (!input.khesra || isSyntheticIdentifier(input.khesra))
    && [input.district, input.circle, input.village, input.nickname].every(isSyntheticDemoLabel);
}

export function isApprovedSyntheticFixture<T extends { id: string; isSynthetic: boolean }>(fixtures: readonly T[], fixtureId: string) {
  return fixtures.find((fixture) => fixture.id === fixtureId && fixture.isSynthetic) ?? null;
}
