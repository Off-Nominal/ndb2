import { triggerPredictionById } from "./post_predictions_{predictionId}_trigger";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { vi } from "vitest";
import { eventsManager } from "@domain/events/eventsManager";
import { errorHandler } from "../../middleware/errorHandler";
import { useEphemeralDb } from "../../../../test/with-ephemeral-db";
import { defaultUsers } from "../../../../test/factories/users";
import { defaultPastCurrentFutureSeasons } from "../../../../test/factories/seasons";
import { prediction } from "../../../../test/factories/predictions";
import * as C from "../../../../test/factories/constants";

useEphemeralDb({
  users: defaultUsers(),
  seasons: defaultPastCurrentFutureSeasons(),
  predictions: [
    prediction(1, {
      text: "open",
      baseDate: { days: 0 },
      due: { days: 25 },
    }),
    prediction(2, {
      text: "checking",
      baseDate: { quarter: "past", days: 10 },
      due: { days: 20 },
      checks: [{ checked: { days: 0 } }],
    }),
    prediction(3, {
      text: "retired",
      baseDate: { quarter: "past", days: 10 },
      due: { days: 20 },
      retired: { days: 5 },
    }),
    prediction(4, {
      text: "closed",
      baseDate: { quarter: "past", days: 25 },
      due: { days: 40 },
      closed: { days: 40 },
      triggered: { days: 40 },
      votes: [
        {
          user_id: C.USER_1_ID,
          voted: { days: 40, minutes: 5 },
          vote: true,
        },
      ],
    }),
  ],
});

describe("POST /predictions/:prediction_id/trigger", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    triggerPredictionById(app);
    app.use(errorHandler);
  });

  it("should reject a non-numeric prediction_id", async () => {
    const response = await request(app)
      .post("/abc/trigger")
      .send({ discord_id: C.DISCORD_1 });
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
      .send({ discord_id: C.DISCORD_1 });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBeTruthy();
  });

  it("should return 400 when discord_id is missing", async () => {
    const response = await request(app).post("/1/trigger").send({});
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
      .send({ discord_id: C.DISCORD_1 });
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
      .post("/4/trigger")
      .send({ discord_id: C.DISCORD_2 });
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
      .post("/3/trigger")
      .send({ discord_id: C.DISCORD_1 });
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
      .post("/1/trigger")
      .send({
        discord_id: C.DISCORD_2,
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
      .post("/1/trigger")
      .send({
        discord_id: C.DISCORD_2,
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
      .post("/1/trigger")
      .send({ discord_id: C.DISCORD_2 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 1, status: "closed" });
    expect(emitSpy).toHaveBeenCalledWith(
      "triggered_prediction",
      expect.objectContaining({ id: 1 }),
    );

    emitSpy.mockRestore();
  });

  it("should trigger a checking prediction and emit triggered_snooze_check", async () => {
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .post("/2/trigger")
      .send({ discord_id: C.DISCORD_2 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 2, status: "closed" });
    expect(emitSpy).toHaveBeenCalledWith(
      "triggered_snooze_check",
      expect.objectContaining({ id: 2 }),
    );

    emitSpy.mockRestore();
  });
});
