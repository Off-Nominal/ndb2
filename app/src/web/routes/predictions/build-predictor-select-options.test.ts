import type { PortalGuildCachedMemberProfile } from "@domain/discord";
import { describe, expect, it } from "vitest";
import {
  ANY_PREDICTOR_SELECT_OPTION,
  buildPredictionPredictorSelectOptions,
} from "./build-predictor-select-options";

describe("buildPredictionPredictorSelectOptions", () => {
  const alice: PortalGuildCachedMemberProfile = {
    discordId: "123456789012345678",
    displayName: "Alice",
    avatarUrl: "https://cdn.discordapp.com/avatars/a.webp",
  };

  const bob: PortalGuildCachedMemberProfile = {
    discordId: "987654321098765432",
    displayName: "Bob <script>",
    avatarUrl: "https://example.com/x?a=1&b=2",
  };

  it("starts with Any predictor and maps members with escaped HTML", () => {
    const opts = buildPredictionPredictorSelectOptions([alice, bob], undefined);

    expect(opts[0]).toEqual(ANY_PREDICTOR_SELECT_OPTION);
    expect(opts).toHaveLength(3);

    const bobOpt = opts.find((o) => o.value === bob.discordId);
    expect(bobOpt?.label).toContain("Bob");
    expect(bobOpt?.labelHtml).toMatch(/Bob &lt;script/);
    expect(bobOpt?.labelHtml).toContain("src=\"https://example.com/x?a=1&amp;b=2\"");
  });

  it("adds a guild-cache fallback row when the selected id is missing", () => {
    const opts = buildPredictionPredictorSelectOptions([alice], "999999999999999999");

    expect(opts.map((o) => o.value)).toEqual([
      "",
      "999999999999999999",
      alice.discordId,
    ]);
    const orphan = opts.find((o) => o.value === "999999999999999999");
    expect(orphan?.labelHtml).toContain("Not in guild cache");
  });

  it("uses REST fallback profile when provided for a missing selected id", () => {
    const opts = buildPredictionPredictorSelectOptions(
      [alice],
      "999999999999999999",
      {
        discordId: "999999999999999999",
        displayName: "Zed",
        avatarUrl: "https://cdn.discordapp.com/z.webp",
      },
    );

    const orphan = opts.find((o) => o.value === "999999999999999999");
    expect(orphan?.labelHtml).toContain("Zed");
    expect(orphan?.labelHtml).not.toContain("Not in guild cache");
  });
});
