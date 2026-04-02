import { untriggerPredictionById } from "./delete_predictions_{predictionId}_trigger";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { untriggerPredictionById as untriggerQuery } from "../../queries/predictions/predictions.queries";
import predictions from "../../queries/predictions";
import { vi } from "vitest";
import { eventsManager } from "../../managers/events";

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

  it("should emit 'untriggered_prediction' event with correct prediction data", async () => {
    // Spy on the eventsManager.emit method
    const emitSpy = vi.spyOn(eventsManager, "emit");

    // Use seeded prediction with ID 7 (closed status)
    const response = await request(app).delete("/7/trigger");

    // Verify the request was successful
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id", 7);

    // Verify the event emitter was called with the correct event name
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(
      "untriggered_prediction",
      expect.objectContaining({
        id: 7,
      })
    );

    // Verify the prediction passed to the event has the expected structure
    const emitCall = emitSpy.mock.calls[0];
    expect(emitCall[0]).toBe("untriggered_prediction");
    const emittedPrediction =
      emitCall[1] as API.Entities.Predictions.Prediction;
    expect(emittedPrediction).toHaveProperty("id", 7);
    expect(emittedPrediction).toHaveProperty("text");
    expect(emittedPrediction).toHaveProperty("status");

    // Clean up
    emitSpy.mockRestore();
  });
});
