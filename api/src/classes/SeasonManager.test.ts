import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PoolClient } from "pg";
import { SeasonManager } from "./SeasonManager";
import { resetTestDatabase } from "../test/global-setup";
import schedule from "node-schedule";
import pool from "../db";
import predictions from "../db/queries/predictions";

vi.mock("../db/queries/predictions", () => ({
  default: {
    getNextPredictionToTrigger: vi.fn(),
  },
}));

// Mock the schedule package
vi.mock("node-schedule", () => ({
  default: {
    scheduleJob: vi.fn(),
  },
}));

// Mock the webhook manager
// const mockWebhookManager = {
//   emit: vi.fn(),
// };

// vi.mock("../config/webhook_subscribers", () => ({
//   default: mockWebhookManager,
// }));

describe("SeasonManager", () => {
  // let client: PoolClient;

  beforeAll(async () => {
    // Reset the test database before each test
    // await resetTestDatabase();
    // Get a database client
    // client = await pool.connect();
  });

  afterEach(async () => {
    // Release the client after each test
    // if (client) {
    //   client.release();
    // }

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
      it("correctly initializes and schedules the job with the right cron signature", async () => {
        const mockScheduleJob = vi.mocked(schedule.scheduleJob);

        const seasonManager = new SeasonManager();

        await seasonManager.initialize();

        // Verify that scheduleJob was called with the correct cron expression
        expect(mockScheduleJob).toHaveBeenCalledWith(
          "1 0 * * *",
          expect.any(Function)
        );

        // Verify that the seasons were fetched and set
        expect((seasonManager as any).seasons).toHaveLength(4);

        // Verify that the job function is properly set up
        const jobCallback = mockScheduleJob.mock.calls[0][1];
        expect(typeof jobCallback).toBe("function");
      });
    });
  });
});
