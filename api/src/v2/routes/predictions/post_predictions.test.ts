import express from "express";
import request from "supertest";
import { describe, beforeAll, it, expect, vi } from "vitest";
import * as API from "@offnominal/ndb2-api-types/v2";
import { createPrediction } from "./post_predictions";
import { useDbTransactionMock } from "../../../test/db-transaction-mock";
import { eventsManager } from "../../managers/events";

useDbTransactionMock();

describe("POST /predictions", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    createPrediction(app);
  });

  it("should return 400 when required fields are missing", async () => {
    const response = await request(app).post("/").send({
      text: "Missing check date",
      discord_id: "111111111111111111",
      driver: "event",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_BODY_DATA &&
          err.message.includes("date")
      )
    ).toBeTruthy();
  });

  it("should reject date-driven predictions with past due dates", async () => {
    const response = await request(app)
      .post("/")
      .send({
        text: "Past due date prediction",
        discord_id: "111111111111111111",
        date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        driver: "date",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some(
        (err: API.Utils.ErrorInfo) =>
          err.code === API.Errors.MALFORMED_BODY_DATA &&
          err.message.includes("future")
      )
    ).toBeTruthy();
  });

  it("should create a date-driven prediction", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const response = await request(app).post("/").send({
      text: "V2 Date Prediction",
      discord_id: "111111111111111111",
      date: futureDate,
      driver: "date",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.driver).toBe("date");
    expect(response.body.data.due_date).not.toBeNull();
    expect(response.body.data.check_date).toBeNull();
    expect(response.body.data.bets.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.bets[0].better.discord_id).toBe(
      "111111111111111111"
    );
  });

  it("should create an event-driven prediction and emit webhook event", async () => {
    const futureCheckDate = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000
    ).toISOString();
    const emitSpy = vi.spyOn(eventsManager, "emit");
    const discordId = "111111111111111111";

    const response = await request(app).post("/").send({
      text: "V2 Event Prediction",
      discord_id: discordId,
      date: futureCheckDate,
      driver: "event",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.driver).toBe("event");
    expect(response.body.data.check_date).not.toBeNull();
    expect(response.body.data.bets.length).toBe(1);
    expect(response.body.data.bets[0].better.discord_id).toBe(discordId);

    expect(emitSpy).toHaveBeenCalledWith(
      "new_prediction",
      expect.objectContaining({
        text: "V2 Event Prediction",
      })
    );

    emitSpy.mockRestore();
  });
});
