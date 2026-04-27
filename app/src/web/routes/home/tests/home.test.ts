import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "../../../mountWeb";

describe("routes/home", () => {
  it("GET / redirects anonymous users to the login page", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/").expect(302);

    expect(res.headers.location).toMatch(/^\/login\?/);
    expect(res.headers.location).toContain("returnTo=%2F");
  });

  it("GET / uses cookie when ndb2_theme is set but still requires sign-in", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app)
      .get("/")
      .set("Cookie", "ndb2_theme=dark")
      .expect(302);

    expect(res.headers.location).toMatch(/^\/login\?/);
  });
});
