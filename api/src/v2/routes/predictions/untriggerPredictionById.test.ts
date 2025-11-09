import { untriggerPredictionById } from "./untriggerPredictionById";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { untriggerPredictionById as untriggerQuery } from "../../queries/predictions/predictions.queries";
import predictions from "../../queries/predictions";
import { vi } from "vitest";

// Enable transaction wrapping for all tests in this file
useDbTransactionMock();

describe("DELETE /predictions/:prediction_id/trigger", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    untriggerPredictionById(app);
  });

  it("should reject a non-numeric id", async () => {
    const response = await request(app).delete("/abc/trigger");
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
    const response = await request(app).delete("/2147483648/trigger");
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
    const response = await request(app).delete("/999999/trigger");
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
      const response = await request(app).delete("/4/trigger");
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
      const response = await request(app).delete("/5/trigger");
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
      const response = await request(app).delete("/6/trigger");
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        response.body.errors.some(
          (err: API.Utils.ErrorInfo) =>
            err.code === API.Errors.INVALID_PREDICTION_STATUS
        )
      ).toBeTruthy();
    });

    it("should reject prediction with 'successful' status", async () => {
      // Use seeded prediction with ID 8 (successful status)
      const response = await request(app).delete("/8/trigger");
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(
        response.body.errors.some(
          (err: API.Utils.ErrorInfo) =>
            err.code === API.Errors.INVALID_PREDICTION_STATUS
        )
      ).toBeTruthy();
    });

    it("should reject prediction with 'failed' status", async () => {
      // Use seeded prediction with ID 9 (failed status)
      const response = await request(app).delete("/9/trigger");
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
});
