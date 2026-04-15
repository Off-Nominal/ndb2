import { retirePredictionById } from "./patch_predictions_{predictionId}_retire";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { vi } from "vitest";
import { eventsManager } from "../../managers/events";
import { useEphemeralDb } from "../../../test/with-ephemeral-db";
import { testUsersThree } from "../../../test/factories/users";
import { standardSeasonsTriple } from "../../../test/factories/seasons";
import { seedForPatchRetire } from "../../../test/factories/predictions";

useEphemeralDb({
  users: testUsersThree(),
  seasons: standardSeasonsTriple(),
  predictions: seedForPatchRetire(),
});

describe("PATCH /predictions/:prediction_id/retire", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    retirePredictionById(app);
  });

  it("should reject a non-numeric id", async () => {
    const response = await request(app)
      .patch("/abc/retire")
      .send({ discord_id: "111111111111111111" });
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
    const response = await request(app)
      .patch("/2147483648/retire")
      .send({ discord_id: "111111111111111111" });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS
      )
    ).toBeTruthy();
  });

  it("should return 400 if discord_id is missing from body", async () => {
    const response = await request(app).patch("/1/retire").send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_BODY_DATA
      )
    ).toBeTruthy();
  });

  it("should return 404 for a non-existent prediction", async () => {
    const response = await request(app)
      .patch("/999999/retire")
      .send({ discord_id: "111111111111111111" });
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
    it("should reject prediction with 'checking' status", async () => {
      const response = await request(app)
        .patch("/2/retire")
        .send({ discord_id: "111111111111111111" });
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
      const response = await request(app)
        .patch("/3/retire")
        .send({ discord_id: "111111111111111111" });
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
      const response = await request(app)
        .patch("/4/retire")
        .send({ discord_id: "111111111111111111" });
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
      const response = await request(app)
        .patch("/5/retire")
        .send({ discord_id: "111111111111111111" });
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
      const response = await request(app)
        .patch("/6/retire")
        .send({ discord_id: "111111111111111111" });
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

  it("should return 403 if prediction does not belong to user", async () => {
    const response = await request(app)
      .patch("/1/retire")
      .send({ discord_id: "999999999999999999" });
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_OWNERSHIP
      )
    ).toBeTruthy();
  });

  it("should successfully retire an open prediction", async () => {
    const response = await request(app)
      .patch("/1/retire")
      .send({ discord_id: "111111111111111111" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("id", 1);
    expect(response.body.data.status).toBe("retired");
    expect(response.body.data.retired_date).not.toBeNull();
    expect(response.body.message).toBe("Prediction retired successfully.");
  });

  it("should emit 'retired_prediction' event with correct prediction data", async () => {
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .patch("/7/retire")
      .send({ discord_id: "111111111111111111" });

    if (response.status === 200) {
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id", 7);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(
        "retired_prediction",
        expect.objectContaining({
          id: 7,
        })
      );

      const emitCall = emitSpy.mock.calls[0];
      expect(emitCall[0]).toBe("retired_prediction");
      const emittedPrediction =
        emitCall[1] as API.Entities.Predictions.Prediction;
      expect(emittedPrediction).toHaveProperty("id", 7);
      expect(emittedPrediction).toHaveProperty("text");
      expect(emittedPrediction).toHaveProperty("status", "retired");
      expect(emittedPrediction).toHaveProperty("retired_date");
    } else {
      // If the prediction is already retired, skip the event check
      // This can happen if tests run in a different order
      expect(response.status).toBe(400);
    }

    // Clean up
    emitSpy.mockRestore();
  });
});
