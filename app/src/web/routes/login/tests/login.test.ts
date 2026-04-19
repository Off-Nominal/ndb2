import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "../../../mountWeb";

describe("routes/login", () => {
  it("GET /login renders the sign-in page with a Discord link", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/login").expect(200);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Sign in with Discord");
    expect(res.text).toContain("/auth/discord?");
    expect(res.text).toContain(encodeURIComponent("/"));
  });

  it("GET /login embeds returnTo for post-login redirect", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app)
      .get("/login")
      .query({ returnTo: "/demo/suspense" })
      .expect(200);

    expect(res.text).toContain(encodeURIComponent("/demo/suspense"));
  });
});
