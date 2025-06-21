import { getPredictionById } from "./getPredictionById";
import express from "express";
import request from "supertest";

describe("GET /predictions/:prediction_id", () => {
  let app = express();

  beforeEach(() => {
    app = express();
    getPredictionById(app);
  });

  it("should reject a non-numeric id", async () => {
    const response = await request(app).get("/abc");
    expect(response.status).toBe(400);
  });
});
