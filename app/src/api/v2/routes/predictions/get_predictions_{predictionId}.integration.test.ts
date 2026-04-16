import { getPredictionById } from "./get_predictions_{predictionId}";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
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
      text: "Date prediction with two bets",
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
      text: "Closed judged date prediction",
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
      text: "Event prediction — judged with snooze check",
      driver: "event",
      baseDate: { quarter: "past", days: 25 },
      check_date: { days: 20 },
      closed: { days: 27 },
      triggered: { days: 27 },
      judged: { days: 28 },
      bets: [
        { user_id: C.USER_1_ID, created: { days: 0 }, endorsed: true },
        {
          user_id: C.USER_2_ID,
          created: { days: 1, minutes: 5 },
          endorsed: false,
        },
      ],
      votes: [
        {
          user_id: C.USER_1_ID,
          voted: { days: 0, minutes: 5 },
          vote: true,
        },
        {
          user_id: C.USER_2_ID,
          voted: { days: 0, minutes: 15 },
          vote: false,
        },
        {
          user_id: C.USER_3_ID,
          voted: { days: 0, minutes: 25 },
          vote: true,
        },
      ],
      checks: [
        {
          checked: { days: 0 },
          closed: { days: 0, minutes: 30 },
          votes: [
            {
              user_id: C.USER_1_ID,
              value: 7,
              created: { days: 0, minutes: 5 },
            },
            {
              user_id: C.USER_2_ID,
              value: 7,
              created: { days: 0, minutes: 15 },
            },
            {
              user_id: C.USER_3_ID,
              value: 7,
              created: { days: 0, minutes: 25 },
            },
          ],
        },
      ],
    }),
  ],
});

describe("GET /predictions/:prediction_id", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    getPredictionById(app);
  });

  it("should reject a non-numeric id", async () => {
    const response = await request(app).get("/abc");
    expect(response.status).toBe(400);
  });

  it("should return 404 for a non-existent prediction", async () => {
    const response = await request(app).get("/999999");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.PREDICTION_NOT_FOUND
      )
    ).toBeTruthy();
  });

  it("should return 400 if the prediction Id is higher than a Postgres Max Int", async () => {
    const response = await request(app).get("/2147483648");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_URL_PARAMS
      )
    ).toBeTruthy();
  });

  it("should return a prediction if it exists", async () => {
    const response = await request(app).get("/1");
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(1);
  });

  it("should return complete prediction data for a judged event prediction", async () => {
    const response = await request(app).get("/3");
    expect(response.status).toBe(200);

    const p = response.body.data;

    expect(p.status).toBe("successful");

    expect(p.predictor).toEqual({
      id: C.USER_1_ID,
      discord_id: C.DISCORD_1,
    });

    expect(p.season_id).not.toBeNull();
    expect(p.season_applicable).toBe(true);
    expect(p.last_check_date).not.toBeNull();
    expect(p.triggerer).toBeNull();

    expect(p.bets).toHaveLength(2);
    expect(p.bets.some((b: { endorsed: boolean }) => b.endorsed === true)).toBe(
      true
    );
    expect(
      p.bets.some((b: { endorsed: boolean }) => b.endorsed === false)
    ).toBe(true);

    expect(p.votes).toHaveLength(3);
    const trueVotes = p.votes.filter((v: { vote: boolean }) => v.vote === true)
      .length;
    const falseVotes = p.votes.filter(
      (v: { vote: boolean }) => v.vote === false
    ).length;
    expect(trueVotes).toBe(2);
    expect(falseVotes).toBe(1);

    expect(p.checks).toHaveLength(1);
    expect(p.checks[0].closed).toBe(true);
    expect(p.checks[0].values).toMatchObject({
      day: expect.any(Number),
      week: expect.any(Number),
    });

    expect(p.payouts).toMatchObject({
      endorse: expect.any(Number),
      undorse: expect.any(Number),
    });

    expect(p.created_date).toBeDefined();
    expect(p.closed_date).toBeDefined();
    expect(p.triggered_date).toBeDefined();
    expect(p.judged_date).toBeDefined();
    expect(p.check_date).toBeDefined();
  });
});
