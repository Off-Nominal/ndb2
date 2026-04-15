import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect, vi } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { postPredictionVote } from "./post_predictions_{predictionId}_votes";
import { eventsManager } from "../../managers/events";
import { useEphemeralDb } from "../../../test/with-ephemeral-db";
import { testUsersThree } from "../../../test/factories/users";
import { standardSeasonsTriple } from "../../../test/factories/seasons";
import { seedForPostVotes } from "../../../test/factories/predictions";

useEphemeralDb({
  users: testUsersThree(),
  seasons: standardSeasonsTriple(),
  predictions: seedForPostVotes(),
});

describe("POST /predictions/:prediction_id/votes", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    postPredictionVote(app);
  });

  it("returns 400 for malformed prediction_id", async () => {
    const response = await request(app)
      .post("/abc/votes")
      .send({ discord_id: "111111111111111111", vote: true });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS,
      ),
    ).toBeTruthy();
  });

  it("returns 400 when vote is missing", async () => {
    const response = await request(app)
      .post("/2/votes")
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
      .post("/999999/votes")
      .send({ discord_id: "111111111111111111", vote: true });
    expect(response.status).toBe(404);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND,
      ),
    ).toBeTruthy();
  });

  it("returns 400 when prediction is not closed", async () => {
    const response = await request(app)
      .post("/1/votes")
      .send({ discord_id: "111111111111111111", vote: true });
    expect(response.status).toBe(400);
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.INVALID_PREDICTION_STATUS,
      ),
    ).toBeTruthy();
  });

  it("returns 200 when vote is unchanged (same as existing)", async () => {
    const response = await request(app)
      .post("/2/votes")
      .send({ discord_id: "111111111111111111", vote: true });
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(2);
    expect(response.body.message).toMatch(/already voted/i);
  });

  it("updates vote and emits new_vote", async () => {
    const emitSpy = vi.spyOn(eventsManager, "emit");

    const response = await request(app)
      .post("/2/votes")
      .send({ discord_id: "111111111111111111", vote: false });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(2);
    const userVote = response.body.data.votes.find(
      (v: { voter: { discord_id: string }; vote: boolean }) =>
        v.voter.discord_id === "111111111111111111",
    );
    expect(userVote?.vote).toBe(false);
    expect(response.body.message).toMatch(/changed/i);
    expect(emitSpy).toHaveBeenCalledWith(
      "new_vote",
      expect.objectContaining({ id: 2 }),
    );

    emitSpy.mockRestore();
  });
});
