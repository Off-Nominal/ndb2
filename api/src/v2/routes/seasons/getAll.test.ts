import { getAllSeasons } from "./getAll";
import express from "express";
import request from "supertest";

describe("GET /seasons", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getAllSeasons(app);
  });

  it("should return all seasons with correct identifiers", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");

    const seasons = response.body.data;
    expect(seasons).toHaveLength(3);

    // Verify each season has the required properties
    seasons.forEach((season: any) => {
      expect(season).toHaveProperty("id");
      expect(season).toHaveProperty("name");
      expect(season).toHaveProperty("start");
      expect(season).toHaveProperty("end");
      expect(season).toHaveProperty("wager_cap");
      expect(season).toHaveProperty("closed");
      expect(season).toHaveProperty("identifier");

      // Verify identifier is one of the expected values
      expect(["past", "current", "future"]).toContain(season.identifier);
    });

    // Verify the seasons are ordered by end date descending
    const endDates = seasons.map((s: any) => new Date(s.end));
    for (let i = 0; i < endDates.length - 1; i++) {
      expect(endDates[i] >= endDates[i + 1]).toBe(true);
    }
  });

  it("should correctly identify past, current, and future seasons", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);

    const seasons = response.body.data;

    // Find seasons by their identifier
    const pastSeason = seasons.find((s: any) => s.identifier === "past");
    const currentSeason = seasons.find((s: any) => s.identifier === "current");
    const futureSeason = seasons.find((s: any) => s.identifier === "future");

    // Verify we have one of each type
    expect(pastSeason).toBeDefined();
    expect(currentSeason).toBeDefined();
    expect(futureSeason).toBeDefined();

    const now = new Date();

    // Verify past season end date is before now
    expect(new Date(pastSeason.end) < now).toBe(true);
    expect(new Date(pastSeason.start) < now).toBe(true);
    expect(pastSeason.closed).toBe(true);

    // Verify current season start is before or equal to now and end is after or equal to now
    expect(new Date(currentSeason.start) <= now).toBe(true);
    expect(new Date(currentSeason.end) >= now).toBe(true);
    expect(currentSeason.closed).toBe(false);

    // Verify future season start date is after now
    expect(new Date(futureSeason.start) > now).toBe(true);
    expect(new Date(futureSeason.end) > now).toBe(true);
    expect(futureSeason.closed).toBe(false);

    // Verify past season is closed
    expect(pastSeason.closed).toBe(true);

    // Verify current season is not closed
  });
});
