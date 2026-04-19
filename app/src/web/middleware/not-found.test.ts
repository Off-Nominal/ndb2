import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "../mountWeb";

describe("webNotFoundMiddleware", () => {
  it("returns HTML 404 for unknown paths outside /api", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app)
      .get("/route-that-does-not-exist-ndb2")
      .expect(404);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Page not found");
    expect(res.text).toContain("There is no page at this URL.");
    expect(res.text).toContain('data-theme=');
  });

  it("returns an HTMX fragment for unknown paths when HX-Request is set", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app)
      .get("/another-missing-path-ndb2")
      .set("HX-Request", "true")
      .expect(404);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("role=\"alert\"");
    expect(res.text).not.toContain("<html");
    expect(res.text).toContain("Page not found");
  });

  it("forwards /api so a later router can handle JSON", async () => {
    const app = express();
    mountWeb(app);
    app.use("/api", (_req, res) => {
      res.status(418).json({ from: "test-api" });
    });

    const res = await request(app).get("/api/teapot-check").expect(418);

    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ from: "test-api" });
  });
});
