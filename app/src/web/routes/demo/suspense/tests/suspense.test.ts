import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "../../../../mountWeb";

describe("routes/demo/suspense", () => {
  it("GET /demo/suspense redirects anonymous users to Discord OAuth", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/demo/suspense").expect(302);

    expect(res.headers.location).toMatch(/^\/auth\/discord\?/);
    expect(res.headers.location).toContain(
      encodeURIComponent("/demo/suspense"),
    );
  });
});
