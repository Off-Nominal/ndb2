import { describe, expect, it } from "vitest";
import {
  formatDatetimeLocalUtc,
  parseAddSeasonForm,
  parseDatetimeLocalAsUtc,
} from "./parse-add-season-form";

describe("parseDatetimeLocalAsUtc", () => {
  it("parses datetime-local as UTC", () => {
    const date = parseDatetimeLocalAsUtc("2026-10-01T00:00");
    expect(date?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("rejects invalid calendar dates", () => {
    expect(parseDatetimeLocalAsUtc("2026-13-01T00:00")).toBeNull();
  });
});

describe("formatDatetimeLocalUtc", () => {
  it("formats ISO strings for datetime-local", () => {
    expect(formatDatetimeLocalUtc("2026-10-01T00:00:00.000Z")).toBe(
      "2026-10-01T00:00",
    );
  });
});

describe("parseAddSeasonForm", () => {
  it("parses a valid body", () => {
    const parsed = parseAddSeasonForm({
      name: " Ignition II ",
      start: "2026-10-01T00:00",
      end: "2027-01-01T00:00",
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.name).toBe("Ignition II");
      expect(parsed.data.start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
      expect(parsed.data.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    }
  });

  it("rejects an empty name", () => {
    const parsed = parseAddSeasonForm({
      name: " ",
      start: "2026-10-01T00:00",
      end: "2027-01-01T00:00",
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain("name");
    }
  });

  it("rejects when start is not before end", () => {
    const parsed = parseAddSeasonForm({
      name: "Bad",
      start: "2027-01-01T00:00",
      end: "2026-10-01T00:00",
      payout_formula: "(ln($1/$2/2.0)/1.3)+1",
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain("before end");
    }
  });
});
