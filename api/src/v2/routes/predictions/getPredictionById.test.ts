import { getPredictionById } from "./getPredictionById";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";

describe("GET /predictions/:prediction_id", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    getPredictionById(app);
  });

  it("should reject a non-numeric id", async () => {
    const response = await request(app).get("/abc");
    expect(response.status).toBe(400);
  });

  it("should return 404 for a non-existent prediction", async () => {
    const response = await request(app).get("/999999");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND
      )
    ).toBeTruthy();
  });

  it("should return a prediction if it exists", async () => {
    const response = await request(app).get("/1");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("prediction");
  });
});
