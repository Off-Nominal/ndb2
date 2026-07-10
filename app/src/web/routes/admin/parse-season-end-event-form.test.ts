import { describe, expect, it } from "vitest";
import { parseSeasonEndEventForm } from "./parse-season-end-event-form";

describe("parseSeasonEndEventForm", () => {
  it("parses a valid season_id", () => {
    expect(parseSeasonEndEventForm({ season_id: "3" })).toEqual({
      ok: true,
      data: { season_id: 3 },
    });
  });

  it("rejects missing season_id", () => {
    const result = parseSeasonEndEventForm({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("valid season");
    }
  });

  it("rejects non-numeric season_id", () => {
    const result = parseSeasonEndEventForm({ season_id: "nope" });
    expect(result.ok).toBe(false);
  });
});
