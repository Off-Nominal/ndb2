import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect, vi } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { postPredictionBet } from "./post_predictions_{predictionId}_bets";
import { eventsManager } from "@domain/events/eventsManager";
import { errorHandler } from "../../middleware/errorHandler";
import betsQueries from "@data/queries/bets";
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
      text: "open with bets",
      baseDate: { quarter: "past", days: 20 },
      due: { days: 10 },
      bets: [
        {
          user_id: C.USER_1_ID,
          created: { days: 0 },
          endorsed: true,
        },
        {
          user_id: C.USER_2_ID,
          created: { days: 1 },
          endorsed: true,
        },
      ],
    }),
    prediction(2, {
      text: "closed judged",
      baseDate: { quarter: "past", days: 25 },
      due: { days: 40 },
      closed: { days: 40 },
      triggered: { days: 40 },
      judged: { days: 41 },
      bets: [
        { user_id: C.USER_1_ID, created: { minutes: 5 }, endorsed: true },
        { user_id: C.USER_2_ID, created: { minutes: 15 }, endorsed: false },
      ],
      votes: [
        {
          user_id: C.USER_1_ID,
          voted: { days: 40, minutes: 5 },
          vote: true,
        },
        {
          user_id: C.USER_2_ID,
          voted: { days: 40, minutes: 15 },
          vote: false,
        },
      ],
    }),
    prediction(3, {
      text: "open no dup bet",
      baseDate: { days: 0 },
      due: { days: 25 },
    }),
  ],
});

describe("POST /predictions/:prediction_id/bets", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    postPredictionBet(app);
    app.use(errorHandler);
  });

  it("returns 400 for malformed prediction_id", async () => {
    const response = await request(app)
      .post("/abc/bets")
      .send({ discord_id: "111111111111111111", endorsed: true });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBeTruthy();
  });

  it("returns 400 when endorsed is missing", async () => {
    const response = await request(app)
      .post("/3/bets")
      .send({ discord_id: "111111111111111111" });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_BODY_DATA,
      ),
    ).toBeTruthy();
  });

  it("returns 404 for a non-existent prediction", async () => {
    const response = await request(app)
      .post("/999999/bets")
      .send({ discord_id: "111111111111111111", endorsed: true });
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND,
      ),
    ).toBeTruthy();
  });

  it("returns 400 when prediction is not open", async () => {
    const response = await request(app)
      .post("/2/bets")
      .send({ discord_id: "333333333333333333", endorsed: true });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_STATUS,
      ),
    ).toBeTruthy();
  });

  it("returns 400 when bet matches existing endorsement (no change)", async () => {
    const response = await request(app)
      .post("/1/bets")
      .send({ discord_id: "111111111111111111", endorsed: true });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) => err.code === API.Errors.BETS_NO_CHANGE,
      ),
    ).toBeTruthy();
  });

  it("creates a bet on an open prediction and emits new_bet", async () => {
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .post("/3/bets")
      .send({ discord_id: "111111111111111111", endorsed: true });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(3);
    expect(
      response.body.data.bets.some(
        (b: { better: { discord_id: string } }) =>
          b.better.discord_id === "111111111111111111",
      ),
    ).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(
      "new_bet",
      expect.objectContaining({ id: 3 }),
    );

    emitSpy.mockRestore();
  });
});
