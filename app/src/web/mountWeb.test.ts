import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "./mountWeb";

describe("mountWeb", () => {
  it("POST /preferences is not served (theme prefs are set client-side)", async () => {
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    mountWeb(app);

    await request(app)
      .post("/preferences")
      .type("form")
      .send({ theme: "dark", colorScheme: "neptune" })
      .expect(404);
  });

  it("GET /assets/htmx.min.js serves the HTMX script", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/htmx.min.js").expect(200);

    expect(res.headers["content-type"]).toMatch(/javascript/);
    expect(res.text.length).toBeGreaterThan(100);
  });

  it("GET /assets/cube.css serves bundled CUBE stylesheet (tokens, layers, blocks)", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/cube.css").expect(200);

    expect(res.headers["content-type"]).toMatch(/css/);
    expect(res.text).toContain(":root {");
    expect(res.text).toContain("--color-bg:");
    expect(res.text).toContain('html[data-theme="dark"]');
    expect(res.text).toContain("prefers-color-scheme: dark");
    expect(res.text).toContain('html[data-theme="system"]');
    expect(res.text).toContain('html[data-color-scheme="neptune"]');
    expect(res.text).toContain("CUBE");
    expect(res.text).toContain("composition");
    expect(res.text).toContain("utility");
    expect(res.text).toContain("ndb2:block:");
    expect(res.text).toContain("#lucky-result");
  });
});
