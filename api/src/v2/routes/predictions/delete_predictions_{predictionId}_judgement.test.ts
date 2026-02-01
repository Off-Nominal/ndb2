import { unjudgePredictionById } from "./delete_predictions_{predictionId}_judgement";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { vi } from "vitest";
import { eventsManager } from "../../managers/events";
import pool from "../../../db";

// Enable transaction wrapping for all tests in this file
useDbTransactionMock();

const defaultUserId = "550e8400-e29b-41d4-a716-446655440001";

const insertJudgedPredictionInOpenSeason = async (predictionId: number) => {
  const client = await pool.connect();
  const connectMock = pool.connect as unknown as {
    mockResolvedValue: (value: typeof client) => void;
  };
  connectMock.mockResolvedValue(client);

  await client.query(
    `INSERT INTO predictions (
      id,
      user_id,
      text,
      created_date,
      due_date,
      closed_date,
      judged_date,
      triggered_date,
      driver
    )
    VALUES (
      $1,
      $2,
      $3,
      NOW(),
      NOW() + interval '1 day',
      NOW() + interval '1 day',
      NOW() + interval '1 day',
      NOW() + interval '1 day',
      'date'
    )`,
    [predictionId, defaultUserId, "Open season judged prediction"]
  );
};

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

  it("should reject unjudgement if the prediction season is closed", async () => {
    // Use seeded prediction with ID 8 (successful status, past season)
    const response = await request(app).delete("/8/judgement");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_STATUS
      )
    ).toBeTruthy();
  });

  it("should unjudge a prediction and clear judgement data", async () => {
    const predictionId = 1001;
    await insertJudgedPredictionInOpenSeason(predictionId);

    const response = await request(app).delete(`/${predictionId}/judgement`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id", predictionId);
    expect(response.body.data.status).toBe("open");
    expect(response.body.data.judged_date).toBeNull();
    expect(response.body.data.closed_date).toBeNull();
    expect(response.body.data.triggered_date).toBeNull();
    expect(response.body.data.triggerer).toBeNull();
    expect(response.body.data.votes).toHaveLength(0);
  });

  it("should emit 'unjudged_prediction' event with correct prediction data", async () => {
    // Spy on the eventsManager.emit method
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const predictionId = 1002;
    await insertJudgedPredictionInOpenSeason(predictionId);

    const response = await request(app).delete(`/${predictionId}/judgement`);

    // Verify the request was successful
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id", predictionId);

    // Verify the event emitter was called with the correct event name
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(
      "unjudged_prediction",
      expect.objectContaining({
        id: predictionId,
      })
    );

    // Verify the prediction passed to the event has the expected structure
    const emitCall = emitSpy.mock.calls[0];
    expect(emitCall[0]).toBe("unjudged_prediction");
    const emittedPrediction =
      emitCall[1] as API.Entities.Predictions.Prediction;
    expect(emittedPrediction).toHaveProperty("id", predictionId);
    expect(emittedPrediction).toHaveProperty("text");
    expect(emittedPrediction).toHaveProperty("status");

    // Clean up
    emitSpy.mockRestore();
  });
});
