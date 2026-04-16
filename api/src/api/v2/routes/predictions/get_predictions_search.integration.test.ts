import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getPredictionsSearch } from "./get_predictions_search";
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
      text: "Successful prediction for search",
      baseDate: { quarter: "past", days: 25 },
      due: { days: 40 },
      closed: { days: 40 },
      triggered: { days: 40 },
      judged: { days: 41 },
      votes: [
        {
          user_id: C.USER_1_ID,
          voted: { days: 40, minutes: 5 },
          vote: true,
        },
        {
          user_id: C.USER_2_ID,
          voted: { days: 40, minutes: 10 },
          vote: true,
        },
        {
          user_id: C.USER_3_ID,
          voted: { days: 40, minutes: 15 },
          vote: false,
        },
      ],
    }),
  ],
});

describe("GET /predictions/search", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getPredictionsSearch(app);
  });

  it("returns 400 when no standard search parameters are provided", async () => {
    const response = await request(app).get("/search");
    expect(response.status).toBe(400);
    expect(response.body.errors?.length).toBeGreaterThan(0);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) =>
          e.code === API.Errors.MALFORMED_QUERY_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 400 when creator and unbetter are the same", async () => {
    const response = await request(app).get(
      "/search?creator=111111111111111111&unbetter=111111111111111111",
    );
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) =>
          e.code === API.Errors.MALFORMED_QUERY_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 400 for an invalid status value", async () => {
    const response = await request(app).get("/search?status=not-a-status");
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) =>
          e.code === API.Errors.MALFORMED_QUERY_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 400 for an invalid sort_by value", async () => {
    const response = await request(app).get("/search?sort_by=invalid-sort");
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) =>
          e.code === API.Errors.MALFORMED_QUERY_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 400 when keyword exceeds 500 characters", async () => {
    const response = await request(app).get(
      `/search?keyword=${"a".repeat(501)}`,
    );
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) =>
          e.code === API.Errors.MALFORMED_QUERY_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 404 when creator Discord user does not exist", async () => {
    const response = await request(app).get(
      "/search?creator=987654321098765432",
    );
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.USER_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns 200 and prediction rows when searching by status", async () => {
    const response = await request(app).get("/search?status=successful");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty("id");
    expect(response.body.data[0]).toHaveProperty("bets");
    expect(response.body.data[0].bets).toHaveProperty("endorsements");
  });

  it("returns 200 when searching by keyword", async () => {
    const response = await request(app).get("/search?keyword=prediction");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
