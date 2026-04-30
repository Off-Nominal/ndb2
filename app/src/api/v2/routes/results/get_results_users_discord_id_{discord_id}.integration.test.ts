import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getResultsUserAllTime } from "./get_results_users_discord_id_{discord_id}_all_time";
import { getResultsUserSeasonsList } from "./get_results_users_discord_id_{discord_id}_seasons";
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
      text: "User results fixture",
      user_id: C.USER_1_ID,
      baseDate: { quarter: "current", days: 2 },
      due: { days: 30 },
    }),
  ],
});

describe("GET /results/users/discord_id/:discord_id/all-time", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getResultsUserAllTime(app);
  });

  it("returns 404 for unknown Discord id", async () => {
    const response = await request(app).get(
      "/results/users/discord_id/999999999999999999/all-time",
    );
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.USER_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns all-time row for known user", async () => {
    const response = await request(app).get(
      `/results/users/discord_id/${C.DISCORD_1}/all-time`,
    );
    expect(response.status).toBe(200);
    const data = response.body
      .data as API.Endpoints.Results.GET_users_ByDiscordId_all_time.Data;
    expect(data.user.discord_id).toBe(C.DISCORD_1);
    expect(data.points.rank).toBeGreaterThanOrEqual(1);
    expect(data.predictions.rank).toBeGreaterThanOrEqual(1);
    expect(data.bets.rank).toBeGreaterThanOrEqual(1);
    expect(data.total_participants).toBeGreaterThanOrEqual(1);
  });

  it("returns all-time row with zero aggregates for user with no activity", async () => {
    const response = await request(app).get(
      `/results/users/discord_id/${C.DISCORD_2}/all-time`,
    );
    expect(response.status).toBe(200);
    const data = response.body
      .data as API.Endpoints.Results.GET_users_ByDiscordId_all_time.Data;
    expect(data.user.discord_id).toBe(C.DISCORD_2);
    expect(data.predictions.successful).toBe(0);
    expect(data.points.net).toBe(0);
    expect(data.points.rank).toBeNull();
    expect(data.predictions.rank).toBeNull();
    expect(data.bets.rank).toBeNull();
    expect(data.total_participants).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /results/users/discord_id/:discord_id/seasons", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getResultsUserSeasonsList(app);
  });

  it("returns 404 for unknown Discord id", async () => {
    const response = await request(app).get(
      "/results/users/discord_id/999999999999999999/seasons",
    );
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.USER_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns per-season rows for user with activity", async () => {
    const response = await request(app).get(
      `/results/users/discord_id/${C.DISCORD_1}/seasons`,
    );
    expect(response.status).toBe(200);
    const data = response.body
      .data as API.Endpoints.Results.GET_users_ByDiscordId_seasons.Data;
    expect(data.meta.total_count).toBeGreaterThanOrEqual(1);
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    expect(data.results[0].season.name).toBeDefined();
    expect(data.results[0].season.start).toBeDefined();
    expect(data.results[0].season.end).toBeDefined();
    expect(data.results[0].points.rank).toBeGreaterThanOrEqual(1);
    expect(data.results[0].predictions.rank).toBeGreaterThanOrEqual(1);
    expect(data.results[0].bets.rank).toBeGreaterThanOrEqual(1);
    expect(data.results[0].total_participants).toBeGreaterThanOrEqual(1);
  });

  it("returns empty list for user with no season activity", async () => {
    const response = await request(app).get(
      `/results/users/discord_id/${C.DISCORD_2}/seasons`,
    );
    expect(response.status).toBe(200);
    const data = response.body
      .data as API.Endpoints.Results.GET_users_ByDiscordId_seasons.Data;
    expect(data.meta.total_count).toBe(0);
    expect(data.results).toEqual([]);
  });
});
