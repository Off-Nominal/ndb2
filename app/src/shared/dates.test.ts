import { describe, expect, it } from "vitest";
import {
  addUtcQuarters,
  utcCalendarQuarterRange,
  utcStartOfQuarter,
} from "./dates";

describe("utcStartOfQuarter", () => {
  it("snaps to Jan/Apr/Jul/Oct UTC midnights", () => {
    expect(
      utcStartOfQuarter(new Date("2026-08-15T12:00:00.000Z")).toISOString(),
    ).toBe("2026-07-01T00:00:00.000Z");
    expect(
      utcStartOfQuarter(new Date("2026-01-15T00:00:00.000Z")).toISOString(),
    ).toBe("2026-01-01T00:00:00.000Z");
    expect(
      utcStartOfQuarter(new Date("2026-04-01T00:00:00.000Z")).toISOString(),
    ).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("addUtcQuarters", () => {
  it("advances contiguous quarter boundaries in UTC", () => {
    expect(
      addUtcQuarters(new Date("2026-10-01T00:00:00.000Z")).toISOString(),
    ).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("utcCalendarQuarterRange", () => {
  it("returns a half-open [start, end) window", () => {
    expect(utcCalendarQuarterRange(new Date("2026-01-15T00:00:00.000Z"))).toEqual({
      start: new Date("2026-01-01T00:00:00.000Z"),
      end: new Date("2026-04-01T00:00:00.000Z"),
    });
    expect(utcCalendarQuarterRange(new Date("2026-08-15T12:00:00.000Z"))).toEqual({
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-10-01T00:00:00.000Z"),
    });
  });
});
