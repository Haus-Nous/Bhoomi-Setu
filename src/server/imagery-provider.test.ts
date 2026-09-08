import { describe, expect, it } from "vitest";
import { syntheticImageryProvider } from "@/server/imagery-provider";

describe("synthetic imagery provider", () => {
  it("returns a local, non-authoritative two-date hero fixture", async () => {
    const snapshots = await syntheticImageryProvider.getSnapshots("demo-family-001");
    expect(snapshots).toHaveLength(2);
    expect(snapshots?.map((item) => item.metrics?.VEGETATION_CHANGE)).toEqual([68, 49]);
    expect(snapshots?.map((item) => item.metrics?.BUILT_UP_CHANGE)).toEqual([12, 27]);
    expect(snapshots?.every((item) => item.synthetic && item.authoritative === false && item.assetReference.startsWith("synthetic://"))).toBe(true);
  });

  it("returns a stable control fixture and no fixture for unconfigured cases", async () => {
    const control = await syntheticImageryProvider.getSnapshots("demo-family-002");
    expect(control?.map((item) => item.metrics?.VEGETATION_CHANGE)).toEqual([61, 59]);
    expect(control?.map((item) => item.metrics?.BUILT_UP_CHANGE)).toEqual([18, 20]);
    expect(await syntheticImageryProvider.getSnapshots("unknown-case")).toBeNull();
  });
});
