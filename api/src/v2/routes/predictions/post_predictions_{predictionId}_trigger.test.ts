import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect, vi } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { triggerPredictionById } from "./post_predictions_{predictionId}_trigger";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { eventsManager } from "../../managers/events";

useDbTransactionMock();

describe("POST /predictions/:prediction_id/trigger", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    triggerPredictionById(app);
  });

  it("should reject a non-numeric prediction_id", async () => {
    const response = await request(app)
      .post("/abc/trigger")
      .send({ discord_id: "111111111111111111" });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBeTruthy();
  });

  it("should reject prediction_id above Postgres max int", async () => {
    const response = await request(app)
      .post("/2147483648/trigger")
      .send({ discord_id: "111111111111111111" });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBeTruthy();
  });

  it("should return 400 when discord_id is missing", async () => {
    const response = await request(app).post("/4/trigger").send({});
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_BODY_DATA,
      ),
    ).toBeTruthy();
  });

  it("should return 404 for a non-existent prediction", async () => {
    const response = await request(app)
      .post("/999999/trigger")
      .send({ discord_id: "111111111111111111" });
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND,
      ),
    ).toBeTruthy();
  });

  it("should reject closed predictions", async () => {
    const response = await request(app)
      .post("/7/trigger")
      .send({ discord_id: "222222222222222222" });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_STATUS,
      ),
    ).toBeTruthy();
  });

  it("should reject retired predictions", async () => {
    const response = await request(app)
      .post("/6/trigger")
      .send({ discord_id: "111111111111111111" });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_STATUS,
      ),
    ).toBeTruthy();
  });

  it("should reject closed_date in the future", async () => {
    const response = await request(app)
      .post("/4/trigger")
      .send({
        discord_id: "222222222222222222",
        closed_date: "2099-01-01T00:00:00.000Z",
      });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_CLOSED_DATE,
      ),
    ).toBeTruthy();
  });

  it("should reject closed_date before the prediction was created", async () => {
    const response = await request(app)
      .post("/4/trigger")
      .send({
        discord_id: "222222222222222222",
        closed_date: "1970-01-01T00:00:00.000Z",
      });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_CLOSED_DATE,
      ),
    ).toBeTruthy();
  });

  it("should trigger an open prediction and emit triggered_prediction", async () => {
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .post("/4/trigger")
      .send({ discord_id: "222222222222222222" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 4, status: "closed" });
    expect(emitSpy).toHaveBeenCalledWith(
      "triggered_prediction",
      expect.objectContaining({ id: 4 }),
    );

    emitSpy.mockRestore();
  });

  it("should trigger a checking prediction and emit triggered_snooze_check", async () => {
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .post("/5/trigger")
      .send({ discord_id: "222222222222222222" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 5, status: "closed" });
    expect(emitSpy).toHaveBeenCalledWith(
      "triggered_snooze_check",
      expect.objectContaining({ id: 5 }),
    );

    emitSpy.mockRestore();
  });
});
