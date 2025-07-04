import { getPredictionById } from "./getPredictionById";
import express from "express";
import request from "supertest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { resetTestDatabase } from "../../../test/global-setup";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { differenceInDays } from "date-fns";

// Enable transaction wrapping for all tests in this file
useDbTransactionMock();

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

  it("should return complete prediction data for prediction #3", async () => {
    const response = await request(app).get("/3");
    expect(response.status).toBe(200);

    const prediction = response.body.data;

    // Verify basic prediction info
    expect(prediction.status).toBe("successful");

    // Verify predictor
    expect(prediction.predictor).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440001",
      discord_id: "111111111111111111",
    });

    // Verify season Id and season applicable
    expect(prediction.season_id).toBe(1);
    expect(prediction.season_applicable).toBe(true);

    // Verify last_check_date
    expect(prediction.last_check_date).not.toBeNull();

    // Verify triggerer
    expect(prediction.triggerer).toBeNull();

    // Verify bets
    expect(prediction.bets).toHaveLength(2);

    // First bet (endorsed)
    const firstBet = prediction.bets.find((bet: any) => bet.endorsed === true);
    expect(firstBet).toBeDefined();
    expect(firstBet.better).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440001",
      discord_id: "111111111111111111",
    });
    expect(firstBet.wager).toBe(27);
    expect(firstBet.valid).toBe(true);
    expect(firstBet.payout).toBe(26);

    // Second bet (not endorsed)
    const secondBet = prediction.bets.find(
      (bet: any) => bet.endorsed === false
    );
    expect(secondBet).toBeDefined();
    expect(secondBet.better).toEqual({
      id: "550e8400-e29b-41d4-a716-446655440002",
      discord_id: "222222222222222222",
    });
    expect(secondBet.wager).toBe(25);
    expect(secondBet.valid).toBe(true);
    expect(secondBet.payout).toBe(-25);

    // Verify votes
    expect(prediction.votes).toHaveLength(3);

    // Count true and false votes
    const trueVotes = prediction.votes.filter(
      (vote: any) => vote.vote === true
    ).length;
    const falseVotes = prediction.votes.filter(
      (vote: any) => vote.vote === false
    ).length;
    expect(trueVotes).toBe(2);
    expect(falseVotes).toBe(1);

    // Verify snooze checks
    expect(prediction.checks).toHaveLength(1);
    const check = prediction.checks[0];
    expect(check.id).toBe(1);
    expect(check.closed).toBe(true);
    expect(check.votes).toEqual({
      day: 0,
      week: 3,
      month: 0,
      quarter: 0,
      year: 0,
    });

    // Verify payouts
    expect(prediction.payouts).toBeDefined();
    expect(prediction.payouts.endorse).toBe(0.97);
    expect(prediction.payouts.undorse).toBe(1.03);

    // Verify dates are present
    expect(prediction.created_date).toBeDefined();
    expect(prediction.closed_date).toBeDefined();
    expect(prediction.triggered_date).toBeDefined();
    expect(prediction.judged_date).toBeDefined();
    expect(prediction.check_date).toBeDefined();
  });
});
