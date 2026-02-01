import { unjudgePredictionById } from "./delete_predictions_{predictionId}_judgement";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";

// Enable transaction wrapping for all tests in this file
useDbTransactionMock();

describe("DELETE /predictions/:prediction_id/judgement", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    unjudgePredictionById(app);
  });

  it("should reject a non-numeric id", async () => {
    const response = await request(app).delete("/abc/judgement");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS
      )
    ).toBeTruthy();
  });

  it("should return 400 if the prediction Id is higher than a Postgres Max Int", async () => {
    const response = await request(app).delete("/2147483648/judgement");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS
      )
    ).toBeTruthy();
  });

  it("should return 404 for a non-existent prediction", async () => {
    const response = await request(app).delete("/999999/judgement");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND
      )
    ).toBeTruthy();
  });

  describe("should reject predictions with incorrect status", () => {
    it("should reject prediction with 'open' status", async () => {
      // Use seeded prediction with ID 4 (open status)
      const response = await request(app).delete("/4/judgement");
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        response.body.errors.some(
          (err: API.Utils.ErrorInfo) =>
            err.code === API.Errors.INVALID_PREDICTION_STATUS
        )
      ).toBeTruthy();
    });

    it("should reject prediction with 'checking' status", async () => {
      // Use seeded prediction with ID 5 (checking status)
      const response = await request(app).delete("/5/judgement");
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        response.body.errors.some(
          (err: API.Utils.ErrorInfo) =>
            err.code === API.Errors.INVALID_PREDICTION_STATUS
        )
      ).toBeTruthy();
    });

    it("should reject prediction with 'retired' status", async () => {
      // Use seeded prediction with ID 6 (retired status)
      const response = await request(app).delete("/6/judgement");
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        response.body.errors.some(
          (err: API.Utils.ErrorInfo) =>
            err.code === API.Errors.INVALID_PREDICTION_STATUS
        )
      ).toBeTruthy();
    });

    it("should reject prediction with 'closed' status", async () => {
      // Use seeded prediction with ID 7 (closed status)
      const response = await request(app).delete("/7/judgement");
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        response.body.errors.some(
          (err: API.Utils.ErrorInfo) =>
            err.code === API.Errors.INVALID_PREDICTION_STATUS
        )
      ).toBeTruthy();
    });
  });

  it("should unjudge a prediction and clear judgement data", async () => {
    // Use seeded prediction with ID 8 (successful status)
    const response = await request(app).delete("/8/judgement");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id", 8);
    expect(response.body.data.status).toBe("open");
    expect(response.body.data.judged_date).toBeNull();
    expect(response.body.data.closed_date).toBeNull();
    expect(response.body.data.triggered_date).toBeNull();
    expect(response.body.data.triggerer).toBeNull();
    expect(response.body.data.votes).toHaveLength(0);
  });
});
