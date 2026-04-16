import { describe, it, expect, afterEach, vi } from "vitest";
import { SeasonManager } from "./SeasonManager";
import { useEphemeralDb } from "../../test/with-ephemeral-db";
import { defaultUsers } from "../../test/factories/users";
import { defaultPastCurrentFutureSeasons } from "../../test/factories/seasons";

useEphemeralDb({
  users: defaultUsers(),
  seasons: defaultPastCurrentFutureSeasons(),
  predictions: [],
});

describe("SeasonManager", () => {
  afterEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("getSeasonByIdentifier", () => {
    it("can correctly fetch the correct season by identifier", async () => {
      const seasonManager = new SeasonManager();

      // First, populate the seasons by initializing
      await seasonManager.initialize();

      // Test getting current season
      const currentSeason = seasonManager.getSeasonByIdentifier("current");
      expect(currentSeason).toBeDefined();
      expect(currentSeason.identifier).toBe("current");
      expect(currentSeason.name).toBe("Present");

      // Test getting last season
      const lastSeason = seasonManager.getSeasonByIdentifier("last");
      expect(lastSeason).toBeDefined();
      expect(lastSeason.identifier).toBe("past");
      expect(lastSeason.name).toBe("Past");
    });

    it("throws on invalid season identifier", async () => {
      const seasonManager = new SeasonManager();

      // First, populate the seasons by initializing
      await seasonManager.initialize();

      // Test with invalid identifier
      expect(() => {
        seasonManager.getSeasonByIdentifier("invalid" as any);
      }).toThrow("Invalid season identifier");
    });

    describe("initialize", () => {
      it("loads seasons from the database into the cache", async () => {
        const seasonManager = new SeasonManager();

        await seasonManager.initialize();

        expect((seasonManager as any).seasons).toHaveLength(3);
        expect(seasonManager.getSeasonByIdentifier("current").name).toBe("Present");
        expect(seasonManager.getSeasonByIdentifier("last").name).toBe("Past");
      });
    });
  });
});
