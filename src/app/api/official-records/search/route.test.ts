import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/official-records/search/route";

const search = (input: unknown) =>
  POST(
    new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );

describe("official record search API", () => {
  it("returns a traceable synthetic fixture for a valid lookup", async () => {
    const response = await search({
      district: "Demo District",
      circle: "Demo Circle",
      mauza: "Example Mauza A",
      khataNumber: "DEMO-128",
    });
    const body = (await response.json()) as {
      mode: string;
      provider: string;
      results: unknown[];
    };

    expect(response.status).toBe(200);
    expect(body.mode).toBe("synthetic-demo");
    expect(body.provider).toBe("synthetic");
    expect(body.results[0]).toMatchObject({
      provenance: "SYNTHETIC_OFFICIAL_FIXTURE",
      sourceMetadata: { authoritative: false },
    });
  });

  it("returns all deterministic ambiguous candidates and a safe synthetic no-match", async () => {
    const ambiguous = await search({
      district: "Demo District",
      circle: "Demo Circle",
      mauza: "Ambiguous Mauza",
      khataNumber: "DEMO-AMB",
    });
    const noMatch = await search({
      district: "Demo District",
      circle: "Demo Circle",
      mauza: "Example Mauza A",
      khataNumber: "DEMO-NONE",
    });

    expect((await ambiguous.json()).results).toHaveLength(2);
    expect((await noMatch.json()).results).toEqual([]);
  });

  it("rejects malformed or incomplete synthetic searches", async () => {
    expect((await search({})).status).toBe(400);
    expect(
      (
        await search({
          district: "Demo District",
          circle: "Demo Circle",
          mauza: "Example Mauza A",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await search({
          district: 1,
          circle: "Demo Circle",
          mauza: "Example Mauza A",
          khataNumber: "DEMO-128",
        })
      ).status,
    ).toBe(400);
  });
});
