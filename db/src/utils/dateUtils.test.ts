import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getQuarterDates,
  resolveSeedDate,
  getRelativeSeasonDates,
} from "./dateUtils.js";

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
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset NODE_ENV before each test
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original NODE_ENV after each test
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  describe("with string timestamps", () => {
    it("should return the exact date for ISO string", () => {
      const seedDate = "2024-03-15T10:30:00Z";
      const result = resolveSeedDate(seedDate, baseDate);

      expect(result).toEqual(new Date("2024-03-15T10:30:00Z"));
    });
  });

  describe("with quarter-based objects in non-test environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should resolve current quarter with day offset using getQuarterDates", () => {
      const seedDate = { quarter: "current" as const, days: 5 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Current quarter starts 2024-01-01, so day 5 should be 2024-01-06
      expect(result).toEqual(new Date("2024-01-06T00:00:00.000Z"));
    });

    it("should resolve current quarter with day and time offset using getQuarterDates", () => {
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

    it("should resolve future quarter with day offset using getQuarterDates", () => {
      const seedDate = { quarter: "future" as const, days: 1 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Future quarter starts 2024-04-01, so day 1 should be 2024-04-02
      expect(result).toEqual(new Date("2024-04-02T00:00:00.000Z"));
    });

    it("should resolve past quarter with day offset using getQuarterDates", () => {
      const seedDate = { quarter: "past" as const, days: 30 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Past quarter starts 2023-10-01, so day 30 should be 2023-10-31
      expect(result).toEqual(new Date("2023-10-31T00:00:00.000Z"));
    });

    it("should handle default values for optional time fields using getQuarterDates", () => {
      const seedDate = { quarter: "current" as const, days: 10 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Should default hours, minutes, seconds to 0
      expect(result).toEqual(new Date("2024-01-11T00:00:00.000Z"));
    });

    it("should handle partial time specifications using getQuarterDates", () => {
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

  describe("with quarter-based objects in test environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "test";
    });

    it("should resolve current quarter with day offset using getRelativeSeasonDates", () => {
      const seedDate = { quarter: "current" as const, days: 5 };
      const result = resolveSeedDate(seedDate, baseDate);

      // In test env, current season starts 15 days before base date (2024-01-01)
      // So day 5 should be 2024-01-05T12:00:00.000Z
      expect(result).toEqual(new Date("2024-01-05T12:00:00.000Z"));
    });

    it("should resolve current quarter with day and time offset using getRelativeSeasonDates", () => {
      const seedDate = {
        quarter: "current" as const,
        days: 15,
        hours: 6,
        minutes: 30,
        seconds: 45,
      };
      const result = resolveSeedDate(seedDate, baseDate);

      // In test env, current season starts 15 days before base date (2024-01-01)
      // So day 15 + 6:30:45 should be 2024-01-15T18:30:45.000Z
      expect(result).toEqual(new Date("2024-01-15T18:30:45.000Z"));
    });

    it("should resolve future quarter with day offset using getRelativeSeasonDates", () => {
      const seedDate = { quarter: "future" as const, days: 1 };
      const result = resolveSeedDate(seedDate, baseDate);

      // In test env, future season starts 91 days after current season start
      // Current season starts 2024-01-01, so future season starts 2024-04-01
      // So day 1 should be 2024-04-01T11:00:00.000Z
      expect(result).toEqual(new Date("2024-04-01T12:00:00.000Z"));
    });

    it("should resolve past quarter with day offset using getRelativeSeasonDates", () => {
      const seedDate = { quarter: "past" as const, days: 30 };
      const result = resolveSeedDate(seedDate, baseDate);

      // In test env, past season starts 91 days before current season start
      // Current season starts 2024-01-01, so past season starts 2023-10-02
      // So day 30 should be 2023-10-31T11:00:00.000Z
      expect(result).toEqual(new Date("2023-10-31T12:00:00.000Z"));
    });

    it("should handle default values for optional time fields using getRelativeSeasonDates", () => {
      const seedDate = { quarter: "current" as const, days: 10 };
      const result = resolveSeedDate(seedDate, baseDate);

      // Should default hours, minutes, seconds to 0
      expect(result).toEqual(new Date("2024-01-10T12:00:00.000Z"));
    });

    it("should handle partial time specifications using getRelativeSeasonDates", () => {
      const seedDate = {
        quarter: "current" as const,
        days: 20,
        hours: 12,
      };
      const result = resolveSeedDate(seedDate, baseDate);

      // Should default minutes and seconds to 0
      expect(result).toEqual(new Date("2024-01-21T00:00:00.000Z"));
    });
  });

  describe("edge cases", () => {
    it("should handle day 1 correctly in non-test environment", () => {
      process.env.NODE_ENV = "development";
      const seedDate = { quarter: "current" as const, days: 1 };
      const result = resolveSeedDate(seedDate, baseDate);

      expect(result).toEqual(new Date("2024-01-02T00:00:00.000Z"));
    });

    it("should handle day 1 correctly in test environment", () => {
      process.env.NODE_ENV = "test";
      const seedDate = { quarter: "current" as const, days: 1 };
      const result = resolveSeedDate(seedDate, baseDate);

      expect(result).toEqual(new Date("2024-01-01T12:00:00.000Z"));
    });

    it("should handle large day offsets in non-test environment", () => {
      process.env.NODE_ENV = "development";
      const seedDate = { quarter: "current" as const, days: 90 };
      const result = resolveSeedDate(seedDate, baseDate);

      // 90 days from 2024-01-01 should be 2024-03-30T23:00:00.000Z due to date-fns UTC math
      expect(result).toEqual(new Date("2024-03-31T00:00:00.000Z"));
    });

    it("should handle large day offsets in test environment", () => {
      process.env.NODE_ENV = "test";
      const seedDate = { quarter: "current" as const, days: 90 };
      const result = resolveSeedDate(seedDate, baseDate);

      // 90 days from 2024-01-01 should be 2024-03-30T11:00:00.000Z due to date-fns UTC math
      expect(result).toEqual(new Date("2024-03-30T12:00:00.000Z"));
    });

    it("should handle zero values in non-test environment", () => {
      process.env.NODE_ENV = "development";
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

    it("should handle zero values in test environment", () => {
      process.env.NODE_ENV = "test";
      const seedDate = {
        quarter: "current" as const,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
      const result = resolveSeedDate(seedDate, baseDate);

      expect(result).toEqual(new Date("2023-12-31T12:00:00.000Z"));
    });
  });
});

describe("getRelativeSeasonDates", () => {
  // Test with a date that represents day 15 of the current season
  // Let's use 2024-06-15 as our base date (day 15 of a season that started 2024-06-01)
  const baseDate = new Date("2024-06-16T00:00:00Z");

  it("should return correct dates for current season", () => {
    const result = getRelativeSeasonDates(baseDate, "current");

    // Current season should start 15 days before base date (2024-06-01)
    // and end 91 days after start (2024-08-31)
    expect(result.start).toEqual(new Date("2024-06-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-08-31T00:00:00.000Z"));
  });

  it("should return correct dates for past season", () => {
    const result = getRelativeSeasonDates(baseDate, "past");

    // Past season should start 91 days before current season start (2024-03-02)
    // and end 91 days after that (2024-06-01)
    expect(result.start).toEqual(new Date("2024-03-02T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-06-01T00:00:00.000Z"));
  });

  it("should return correct dates for future season", () => {
    const result = getRelativeSeasonDates(baseDate, "future");

    // Future season should start 91 days after current season start (2024-08-31)
    // and end 91 days after that (2024-11-30)
    expect(result.start).toEqual(new Date("2024-08-31T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2024-11-30T00:00:00.000Z"));
  });

  // Test year boundary crossing
  const yearBoundaryDate = new Date("2024-12-16T00:00:00Z");

  it("should handle year boundary crossing correctly", () => {
    const result = getRelativeSeasonDates(yearBoundaryDate, "current");

    // Current season should start 15 days before base date (2024-12-01)
    // and end 91 days after start (2025-03-02)
    expect(result.start).toEqual(new Date("2024-12-01T00:00:00.000Z"));
    expect(result.end).toEqual(new Date("2025-03-02T00:00:00.000Z"));
  });
});
