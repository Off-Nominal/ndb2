import { describe, expect, it } from "vitest";
import { buildPredictionSeasonSelectOptions } from "./build-season-select-options";

describe("buildPredictionSeasonSelectOptions", () => {
  it("marks current and last past season, lists All-time last, and embeds markdown title HTML", () => {
    const opts = buildPredictionSeasonSelectOptions([
      {
        id: 3,
        name: "**Season Three**",
        start: "2025-06-01T00:00:00.000Z",
        end: "2026-05-31T00:00:00.000Z",
        identifier: "current",
      },
      {
        id: 2,
        name: "Season Two",
        start: "2024-06-01T00:00:00.000Z",
        end: "2025-05-31T00:00:00.000Z",
        identifier: "past",
      },
      {
        id: 1,
        name: "Season One",
        start: "2023-06-01T00:00:00.000Z",
        end: "2024-05-31T00:00:00.000Z",
        identifier: "past",
      },
    ]);

    expect(opts.map((o) => o.value)).toEqual(["3", "2", "1", ""]);

    const current = opts.find((o) => o.value === "3");
    expect(current?.label).toContain("This season");
    expect(current?.labelHtml).toContain("select__season-badge");
    expect(current?.labelHtml).toContain("This season");
    expect(current?.labelHtml).toContain("<strong>Season Three</strong>");

    const last = opts.find((o) => o.value === "2");
    expect(last?.label).toContain("Last season");
    expect(last?.labelHtml).toContain("Last season");

    const oldest = opts.find((o) => o.value === "1");
    expect(oldest?.labelHtml).not.toContain("This season");
    expect(oldest?.labelHtml).not.toContain("Last season");

    expect(opts[opts.length - 1]?.label).toBe("All-time");
    expect(opts[opts.length - 1]?.labelHtml).toBeUndefined();
  });
});
