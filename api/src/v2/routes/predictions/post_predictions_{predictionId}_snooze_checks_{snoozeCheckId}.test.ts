import { postPredictionSnoozeCheckVote } from "./post_predictions_{predictionId}_snooze_checks_{snoozeCheckId}";
import { getPredictionById } from "./get_predictions_{predictionId}";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { vi } from "vitest";
import { eventsManager } from "../../managers/events";

useDbTransactionMock();

describe("POST /predictions/:prediction_id/snooze_checks/:snooze_check_id", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    getPredictionById(app);
    postPredictionSnoozeCheckVote(app);
  });

  it("should reject invalid snooze_check_id", async () => {
    const response = await request(app)
      .post("/5/snooze_checks/abc")
      .send({ discord_id: "111111111111111111", value: 7 });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBeTruthy();
  });

  it("should return 404 for a non-existent prediction", async () => {
    const response = await request(app)
      .post("/999999/snooze_checks/1")
      .send({ discord_id: "111111111111111111", value: 7 });
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND,
      ),
    ).toBeTruthy();
  });

  it("should reject non-checking predictions", async () => {
    const response = await request(app)
      .post("/4/snooze_checks/2")
      .send({ discord_id: "111111111111111111", value: 7 });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_STATUS,
      ),
    ).toBeTruthy();
  });

  it("should reject an invalid snooze value", async () => {
    const response = await request(app)
      .post("/5/snooze_checks/2")
      .send({ discord_id: "111111111111111111", value: 2 });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_BODY_DATA,
      ),
    ).toBeTruthy();
  });

  it("should reject a snooze check that does not belong to the prediction", async () => {
    const response = await request(app)
      .post("/5/snooze_checks/99999")
      .send({ discord_id: "111111111111111111", value: 7 });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.SNOOZE_CHECK_NOT_FOUND,
      ),
    ).toBeTruthy();
  });

  it("should record a vote on an open snooze check and emit new_snooze_vote", async () => {
    const pred = await request(app).get("/5");
    expect(pred.status).toBe(200);
    const openCheck = pred.body.data.checks.find(
      (c: { closed: boolean }) => !c.closed,
    );
    expect(openCheck).toBeDefined();

    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .post(`/5/snooze_checks/${openCheck.id}`)
      .send({ discord_id: "111111111111111111", value: 7 });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(5);
    expect(emitSpy).toHaveBeenCalledWith("new_snooze_vote", expect.any(Object));

    emitSpy.mockRestore();
  });
});
