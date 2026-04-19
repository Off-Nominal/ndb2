import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "../../../mountWeb";

describe("routes/home", () => {
  it("GET / redirects anonymous users to Discord OAuth", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/").expect(302);

    expect(res.headers.location).toMatch(/^\/auth\/discord\?/);
    expect(res.headers.location).toContain("returnTo=%2F");
  });

  it("GET / uses cookie when ndb2_theme is set but still requires sign-in", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app)
      .get("/")
      .set("Cookie", "ndb2_theme=dark")
      .expect(302);

    expect(res.headers.location).toMatch(/^\/auth\/discord\?/);
  });

  it("GET /home/lucky-number redirects when not signed in", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/home/lucky-number").expect(302);

    expect(res.headers.location).toContain("returnTo=");
    expect(res.headers.location).toContain(encodeURIComponent("/home/lucky-number"));
  });
});
