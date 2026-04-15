import { patchPredictionSnooze } from "./patch_predictions_{predictionId}_snooze";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { vi } from "vitest";
import { eventsManager } from "../../managers/events";
import { useEphemeralDb } from "../../../test/with-ephemeral-db";
import { testUsersThree } from "../../../test/factories/users";
import { standardSeasonsTriple } from "../../../test/factories/seasons";
import { seedForPatchSnooze } from "../../../test/factories/predictions";

useEphemeralDb({
  users: testUsersThree(),
  seasons: standardSeasonsTriple(),
  predictions: seedForPatchSnooze(),
});

const futureIso = () =>
  new Date(Date.now() + 86400000 * 365).toISOString();

describe("PATCH /predictions/:prediction_id/snooze", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    patchPredictionSnooze(app);
  });

  it("should reject a non-numeric prediction_id", async () => {
    const response = await request(app)
      .patch("/abc/snooze")
      .send({
        discord_id: "111111111111111111",
        check_date: futureIso(),
      });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBeTruthy();
  });

  it("should return 400 if check_date is missing", async () => {
    const response = await request(app)
      .patch("/1/snooze")
      .send({ discord_id: "111111111111111111" });
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
      .patch("/999999/snooze")
      .send({
        discord_id: "111111111111111111",
        check_date: futureIso(),
      });
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND,
      ),
    ).toBeTruthy();
  });

  it("should reject retired predictions", async () => {
    const response = await request(app)
      .patch("/2/snooze")
      .send({
        discord_id: "111111111111111111",
        check_date: futureIso(),
      });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_STATUS,
      ),
    ).toBeTruthy();
  });

  it("should update check date for an open prediction and emit webhooks", async () => {
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .patch("/1/snooze")
      .send({
        discord_id: "111111111111111111",
        check_date: futureIso(),
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith(
      "prediction_edit",
      expect.any(Object),
      expect.objectContaining({
        check_date: expect.objectContaining({
          new: expect.any(String),
        }),
      }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      "snoozed_prediction",
      expect.any(Object),
    );

    emitSpy.mockRestore();
  });
});
