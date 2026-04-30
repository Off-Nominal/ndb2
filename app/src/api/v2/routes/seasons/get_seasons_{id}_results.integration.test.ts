import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getAllSeasons } from "./get";
import { getSeasonResults } from "./get_seasons_{id}_results";
import { useEphemeralDb } from "../../../../test/with-ephemeral-db";
import { defaultUsers } from "../../../../test/factories/users";
import { defaultPastCurrentFutureSeasons } from "../../../../test/factories/seasons";
import { prediction } from "../../../../test/factories/predictions";
import * as C from "../../../../test/factories/constants";

useEphemeralDb({
  users: defaultUsers(),
  seasons: defaultPastCurrentFutureSeasons(),
  predictions: [
    prediction(1, {
      text: "Leaderboard fixture",
      user_id: C.USER_1_ID,
      baseDate: { quarter: "current", days: 2 },
      due: { days: 30 },
    }),
  ],
});

describe("GET /seasons/:id/results", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getAllSeasons(app);
    getSeasonResults(app);
  });

  it("returns 400 for invalid season path segment", async () => {
    const response = await request(app).get("/nope/results");
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 404 when season does not exist", async () => {
    const response = await request(app).get("/2147483646/results");
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.SEASON_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns paginated leaderboard for current season", async () => {
    const listRes = await request(app).get("/");
    expect(listRes.status).toBe(200);
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    expect(current).toBeDefined();

    const response = await request(app).get(`/${current!.id}/results`);
    expect(response.status).toBe(200);
    const data = response.body.data as API.Endpoints.Seasons.GET_ById_results.Data;
    expect(data.meta.page).toBe(1);
    expect(data.meta.per_page).toBe(25);
    expect(data.meta.total_count).toBeGreaterThanOrEqual(1);
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    const u1 = data.results.find((r) => r.user.discord_id === C.DISCORD_1);
    expect(u1).toBeDefined();
    expect(u1!.points.rank).toBeGreaterThanOrEqual(1);
    expect(u1!.predictions.rank).toBeGreaterThanOrEqual(1);
    expect(u1!.bets.rank).toBeGreaterThanOrEqual(1);
    expect("total_participants" in u1!).toBe(false);
    expect(typeof u1!.predictions.open).toBe("number");
  });

  it("accepts sort_by and per_page query params", async () => {
    const listRes = await request(app).get("/");
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    const response = await request(app).get(
      `/${current!.id}/results?sort_by=predictions_successful-desc&page=1&per_page=5`,
    );
    expect(response.status).toBe(200);
    const data = response.body.data as API.Endpoints.Seasons.GET_ById_results.Data;
    expect(data.meta.per_page).toBe(5);
    expect(data.results.length).toBeLessThanOrEqual(5);
  });
});
