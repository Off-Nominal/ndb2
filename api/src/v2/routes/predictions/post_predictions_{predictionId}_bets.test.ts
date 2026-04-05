import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect, vi } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { postPredictionBet } from "./post_predictions_{predictionId}_bets";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { eventsManager } from "../../managers/events";
import { errorHandler } from "../../middleware/errorHandler";
import betsQueries from "../../queries/bets";

useDbTransactionMock();

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
      .post("/4/bets")
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
      .post("/4/bets")
      .send({ discord_id: "111111111111111111", endorsed: true });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(4);
    expect(
      response.body.data.bets.some(
        (b: { better: { discord_id: string } }) =>
          b.better.discord_id === "111111111111111111",
      ),
    ).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith(
      "new_bet",
      expect.objectContaining({ id: 4 }),
    );

    emitSpy.mockRestore();
  });
});
