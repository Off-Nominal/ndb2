import { untriggerPredictionById } from "./delete_predictions_{predictionId}_trigger";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { untriggerPredictionById as untriggerQuery } from "../../queries/predictions/predictions.queries";
import predictions from "../../queries/predictions";
import { vi } from "vitest";
import { eventsManager } from "../../managers/events";
import { useEphemeralDb } from "../../../test/with-ephemeral-db";
import { testUsersThree } from "../../../test/factories/users";
import { standardSeasonsTriple } from "../../../test/factories/seasons";
import { seedForDeleteTrigger } from "../../../test/factories/predictions";

useEphemeralDb({
  users: testUsersThree(),
  seasons: standardSeasonsTriple(),
  predictions: seedForDeleteTrigger(),
});

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
      const response = await request(app).delete("/1/trigger");
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
      const response = await request(app).delete("/2/trigger");
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
      const response = await request(app).delete("/3/trigger");
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

    it("should reject prediction with 'failed' status", async () => {
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
  });

  it("should emit 'untriggered_prediction' event with correct prediction data", async () => {
    // Spy on the eventsManager.emit method
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app).delete("/4/trigger");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id", 4);

    // Verify the event emitter was called with the correct event name
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(
      "untriggered_prediction",
      expect.objectContaining({
        id: 4,
      })
    );

    // Verify the prediction passed to the event has the expected structure
    const emitCall = emitSpy.mock.calls[0];
    expect(emitCall[0]).toBe("untriggered_prediction");
    const emittedPrediction =
      emitCall[1] as API.Entities.Predictions.Prediction;
    expect(emittedPrediction).toHaveProperty("id", 4);
    expect(emittedPrediction).toHaveProperty("text");
    expect(emittedPrediction).toHaveProperty("status");

    // Clean up
    emitSpy.mockRestore();
  });
});
