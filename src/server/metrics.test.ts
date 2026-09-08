import { describe, expect, it } from "vitest";
import { InMemoryMetricSink, measure, observe } from "@/server/metrics";

describe("lightweight internal metrics", () => {
  it("records deterministic operation metadata without content", async () => {
    const sink = new InMemoryMetricSink();
    expect(measure(sink, "verification", () => "done", { caseId: "demo-family-001", synthetic: true })).toBe("done");
    expect(sink.snapshot()).toEqual([expect.objectContaining({ operation: "verification", outcome: "success", metadata: { caseId: "demo-family-001", synthetic: true } })]);
  });

  it("does not let instrumentation failure break the workflow", async () => {
    const broken = { record: () => { throw new Error("metrics offline"); }, snapshot: () => [], reset: () => undefined };
    expect(() => observe(broken, { operation: "guidance", outcome: "success", durationMs: 0 })).not.toThrow();
    expect(measure(broken, "guidance", () => "safe")).toBe("safe");
  });
});
