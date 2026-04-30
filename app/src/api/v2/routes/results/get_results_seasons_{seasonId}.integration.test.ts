import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getAllSeasons } from "../seasons/get";
import { getResultsSeasonsBySeasonId } from "./get_results_seasons_{seasonId}";
import { mapRoutes } from "@shared/routerMap";
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

describe("GET /results/seasons/:seasonId", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use("/seasons", mapRoutes([getAllSeasons]));
    app.use("/results", mapRoutes([getResultsSeasonsBySeasonId]));
  });

  it("returns 400 for invalid season path segment", async () => {
    const response = await request(app).get("/results/seasons/nope");
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 404 when season does not exist", async () => {
    const response = await request(app).get("/results/seasons/2147483646");
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.SEASON_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns paginated results list for current season", async () => {
    const listRes = await request(app).get("/seasons/");
    expect(listRes.status).toBe(200);
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    expect(current).toBeDefined();

    const response = await request(app).get(`/results/seasons/${current!.id}`);
    expect(response.status).toBe(200);
    const data = response.body
      .data as API.Endpoints.Results.GET_seasons_BySeasonId.Data;
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

  it("resolves season path lookup current and last", async () => {
    const byCurrent = await request(app).get("/results/seasons/current");
    expect(byCurrent.status).toBe(200);
    const byLast = await request(app).get("/results/seasons/last");
    expect(byLast.status).toBe(200);
  });

  it("accepts sort_by and per_page query params", async () => {
    const listRes = await request(app).get("/seasons/");
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    const response = await request(app).get(
      `/results/seasons/${current!.id}?sort_by=predictions_successful-desc&page=1&per_page=5`,
    );
    expect(response.status).toBe(200);
    const data = response.body
      .data as API.Endpoints.Results.GET_seasons_BySeasonId.Data;
    expect(data.meta.per_page).toBe(5);
    expect(data.results.length).toBeLessThanOrEqual(5);
  });
});
