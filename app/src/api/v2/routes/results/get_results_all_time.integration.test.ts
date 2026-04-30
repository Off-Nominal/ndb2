import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getAllSeasons } from "../seasons/get";
import { getResultsAllTime } from "./get_results_all_time";
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
      text: "All-time list fixture",
      user_id: C.USER_1_ID,
      baseDate: { quarter: "current", days: 2 },
      due: { days: 30 },
    }),
  ],
});

describe("GET /results/all-time", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getAllSeasons(app);
    getResultsAllTime(app);
  });

  it("returns 400 for invalid query", async () => {
    const response = await request(app).get("/results/all-time?sort_by=nope");
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) =>
          e.code === API.Errors.MALFORMED_QUERY_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns paginated all-time cross-user results", async () => {
    const response = await request(app).get("/results/all-time");
    expect(response.status).toBe(200);
    const data = response.body.data as API.Endpoints.Results.GET_all_time.Data;
    expect(data.meta.page).toBe(1);
    expect(data.meta.per_page).toBe(25);
    expect(data.meta.total_count).toBeGreaterThanOrEqual(1);
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    const u1 = data.results.find((r) => r.user.discord_id === C.DISCORD_1);
    expect(u1).toBeDefined();
    expect(u1!.points.rank).toBeGreaterThanOrEqual(1);
    expect("total_participants" in u1!).toBe(false);
  });

  it("accepts sort_by and per_page", async () => {
    const response = await request(app).get(
      "/results/all-time?sort_by=predictions_successful-desc&per_page=5",
    );
    expect(response.status).toBe(200);
    const data = response.body.data as API.Endpoints.Results.GET_all_time.Data;
    expect(data.meta.per_page).toBe(5);
    expect(data.results.length).toBeLessThanOrEqual(5);
  });
});
