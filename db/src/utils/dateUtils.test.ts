import { describe, it, expect } from "vitest";
import { getQuarterDates, resolveSeedDate } from "./dateUtils";

describe("getQuarterDates", () => {
  // Test with a date in Q1 2024
  const baseDateQ1 = new Date("2024-01-15T12:00:00Z");

  it("should return correct dates for current quarter", () => {
    const result = getQuarterDates(baseDateQ1, "current");

    expect(result.start).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-04-01T00:00:00Z"));
  });

  it("should return correct dates for future quarter", () => {
    const result = getQuarterDates(baseDateQ1, "future");

    expect(result.start).toEqual(new Date("2024-04-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-07-01T00:00:00Z"));
  });

  it("should return correct dates for past quarter", () => {
    const result = getQuarterDates(baseDateQ1, "past");

    expect(result.start).toEqual(new Date("2023-10-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-01-01T00:00:00Z"));
  });

  // Test with a date in Q4 2024
  const baseDateQ4 = new Date("2024-12-15T12:00:00Z");

  it("should handle year transition for future quarter from Q4", () => {
    const result = getQuarterDates(baseDateQ4, "future");

    expect(result.start).toEqual(new Date("2025-01-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2025-04-01T00:00:00Z"));
  });

  it("should handle year transition for past quarter from Q1", () => {
    const baseDateQ1 = new Date("2024-01-15T12:00:00Z");
    const result = getQuarterDates(baseDateQ1, "past");

    expect(result.start).toEqual(new Date("2023-10-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-01-01T00:00:00Z"));
  });

  // Test with a date in Q2 2024
  const baseDateQ2 = new Date("2024-05-15T12:00:00Z");

  it("should return correct dates for Q2 current quarter", () => {
    const result = getQuarterDates(baseDateQ2, "current");

    expect(result.start).toEqual(new Date("2024-04-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-07-01T00:00:00Z"));
  });

  it("should return correct dates for Q2 future quarter", () => {
    const result = getQuarterDates(baseDateQ2, "future");

    expect(result.start).toEqual(new Date("2024-07-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-10-01T00:00:00Z"));
  });

  it("should return correct dates for Q2 past quarter", () => {
    const result = getQuarterDates(baseDateQ2, "past");

    expect(result.start).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-04-01T00:00:00Z"));
  });
});

describe("resolveSeedDate", () => {
  const baseDate = new Date("2024-01-15T12:00:00Z"); // Middle of Q1 2024

  describe("with string timestamps", () => {
    it("should return the exact date for ISO string", () => {
      const seedDate = "2024-03-15T10:30:00Z";
      const result = resolveSeedDate(seedDate, baseDate);

      expect(result).toEqual(new Date("2024-03-15T10:30:00Z"));
    });
  });

  describe("with quarter-based objects", () => {
    it("should resolve current quarter with day offset", () => {
      const seedDate = { quarter: "current" as const, days: 5 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Current quarter starts 2024-01-01, so day 5 should be 2024-01-06
      expect(result).toEqual(new Date("2024-01-06T00:00:00.000Z"));
    });

    it("should resolve current quarter with day and time offset", () => {
      const seedDate = {
        quarter: "current" as const,
        days: 15,
        hours: 6,
        minutes: 30,
        seconds: 45,
      };
      const result = resolveSeedDate(seedDate, baseDate);

      // Current quarter starts 2024-01-01, so day 15 + 6:30:45 should be 2024-01-16T06:30:45
      expect(result).toEqual(new Date("2024-01-16T06:30:45.000Z"));
    });

    it("should resolve future quarter with day offset", () => {
      const seedDate = { quarter: "future" as const, days: 1 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Future quarter starts 2024-04-01, so day 1 should be 2024-04-02
      expect(result).toEqual(new Date("2024-04-02T00:00:00.000Z"));
    });

    it("should resolve past quarter with day offset", () => {
      const seedDate = { quarter: "past" as const, days: 30 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Past quarter starts 2023-10-01, so day 30 should be 2023-10-31
      expect(result).toEqual(new Date("2023-10-31T00:00:00.000Z"));
    });

    it("should handle default values for optional time fields", () => {
      const seedDate = { quarter: "current" as const, days: 10 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Should default hours, minutes, seconds to 0
      expect(result).toEqual(new Date("2024-01-11T00:00:00.000Z"));
    });

    it("should handle partial time specifications", () => {
      const seedDate = {
        quarter: "current" as const,
        days: 20,
        hours: 12,
      };
      const result = resolveSeedDate(seedDate, baseDate);

      // Should default minutes and seconds to 0
      expect(result).toEqual(new Date("2024-01-21T12:00:00.000Z"));
    });
  });

  describe("edge cases", () => {
    it("should handle day 1 correctly", () => {
      const seedDate = { quarter: "current" as const, days: 1 };
      const result = resolveSeedDate(seedDate, baseDate);

      expect(result).toEqual(new Date("2024-01-02T00:00:00.000Z"));
    });

    it("should handle large day offsets", () => {
      const seedDate = { quarter: "current" as const, days: 90 };
      const result = resolveSeedDate(seedDate, baseDate);

      // 90 days from 2024-01-01 should be 2024-03-30T23:00:00.000Z due to date-fns UTC math
      expect(result).toEqual(new Date("2024-03-30T23:00:00.000Z"));
    });

    it("should handle zero values", () => {
      const seedDate = {
        quarter: "current" as const,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
      const result = resolveSeedDate(seedDate, baseDate);

      expect(result).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    });
  });
});
