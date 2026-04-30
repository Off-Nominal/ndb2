import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getAllSeasons } from "./get";
import { getSeasonResultForDiscordUser } from "./get_seasons_{id}_users_discord_id_{discord_id}_result";
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
      text: "Singleton fixture",
      user_id: C.USER_1_ID,
      baseDate: { quarter: "current", days: 2 },
      due: { days: 30 },
    }),
  ],
});

describe("GET /seasons/:id/users/discord_id/:discord_id/result", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getAllSeasons(app);
    getSeasonResultForDiscordUser(app);
  });

  it("returns 404 USER_NOT_FOUND for unknown Discord id", async () => {
    const listRes = await request(app).get("/");
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    const response = await request(app).get(
      `/${current!.id}/users/discord_id/999999999999999999/result`,
    );
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.USER_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns 404 RESULT_NOT_FOUND when user did not participate", async () => {
    const listRes = await request(app).get("/");
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    const response = await request(app).get(
      `/${current!.id}/users/discord_id/${C.DISCORD_2}/result`,
    );
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.RESULT_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns one row for a participating user", async () => {
    const listRes = await request(app).get("/");
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    const response = await request(app).get(
      `/${current!.id}/users/discord_id/${C.DISCORD_1}/result`,
    );
    expect(response.status).toBe(200);
    const data = response.body
      .data as API.Endpoints.Seasons.GET_ById_users_ByDiscordId_result.Data;
    expect(data.user.discord_id).toBe(C.DISCORD_1);
    expect(data.points.rank).toBeGreaterThanOrEqual(1);
    expect(data.predictions.rank).toBeGreaterThanOrEqual(1);
    expect(data.bets.rank).toBeGreaterThanOrEqual(1);
    expect(data.total_participants).toBeGreaterThanOrEqual(1);
  });
});
