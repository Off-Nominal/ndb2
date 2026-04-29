import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { getAllSeasons } from "./get";
import { getSeason } from "./get_seasons_{id}";
import { useEphemeralDb } from "../../../../test/with-ephemeral-db";
import { defaultUsers } from "../../../../test/factories/users";
import { defaultPastCurrentFutureSeasons } from "../../../../test/factories/seasons";

useEphemeralDb({
  users: defaultUsers(),
  seasons: defaultPastCurrentFutureSeasons(),
  predictions: [],
});

describe("GET /seasons/:id", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getAllSeasons(app);
    getSeason(app);
  });

  it("returns 400 for an invalid path segment", async () => {
    const response = await request(app).get("/not-a-season");
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 400 when id exceeds Postgres max int", async () => {
    const response = await request(app).get("/2147483648");
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBe(true);
  });

  it("returns 404 when the numeric season does not exist", async () => {
    const response = await request(app).get("/2147483646");
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (e: API.Utils.ErrorInfo) => e.code === API.Errors.SEASON_NOT_FOUND,
      ),
    ).toBe(true);
  });

  it("returns season detail with prediction counts by status", async () => {
    const listRes = await request(app).get("/");
    expect(listRes.status).toBe(200);
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );
    expect(current).toBeDefined();

    const response = await request(app).get(`/${current!.id}`);
    expect(response.status).toBe(200);

    const data = response.body.data as API.Endpoints.Seasons.GET_ById.Data;
    expect(data.id).toBe(current!.id);
    expect(data.identifier).toBe("current");

    for (const status of API.Entities.Predictions.PREDICTION_LIFECYCLE_VALUES) {
      expect(typeof data.predictions[status]).toBe("number");
      expect(data.predictions[status]).toBe(0);
    }
  });

  it("resolves current past and future identifiers to the same rows as list identifiers", async () => {
    const listRes = await request(app).get("/");
    expect(listRes.status).toBe(200);

    for (const identifier of ["past", "current", "future"] as const) {
      const fromList = listRes.body.data.find(
        (s: API.Entities.Seasons.Season) => s.identifier === identifier,
      );
      expect(fromList).toBeDefined();

      const res = await request(app).get(`/${identifier}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: fromList!.id,
        identifier,
      });
    }
  });

  it("matches GET /seasons/current to GET /:numericId for the current season", async () => {
    const listRes = await request(app).get("/");
    const current = listRes.body.data.find(
      (s: API.Entities.Seasons.Season) => s.identifier === "current",
    );

    const byId = await request(app).get(`/${current!.id}`);
    const bySlug = await request(app).get("/current");

    expect(byId.status).toBe(200);
    expect(bySlug.status).toBe(200);
    expect(byId.body.data).toEqual(bySlug.body.data);
  });
});
