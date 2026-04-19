import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "./mountWeb";

describe("mountWeb", () => {
  it("GET /assets/htmx.min.js serves the HTMX script", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/htmx.min.js").expect(200);

    expect(res.headers["content-type"]).toMatch(/javascript/);
    expect(res.text.length).toBeGreaterThan(100);
  });

  it("GET /assets/design-tokens.css serves generated token stylesheet", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/design-tokens.css").expect(200);

    expect(res.headers["content-type"]).toMatch(/css/);
    expect(res.text).toContain(":root {");
    expect(res.text).toContain("--color-bg:");
    expect(res.text).toContain('html[data-theme="dark"]');
  });

  it("GET /assets/globals.css serves CUBE global layer", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/globals.css").expect(200);

    expect(res.headers["content-type"]).toMatch(/css/);
    expect(res.text).toContain("CUBE");
    expect(res.text).toContain("var(--color-bg)");
  });

  it("GET /assets/compositions.css serves CUBE composition layer", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/compositions.css").expect(200);

    expect(res.headers["content-type"]).toMatch(/css/);
    expect(res.text).toContain("composition");
  });

  it("GET /assets/utilities.css serves CUBE utility layer", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/utilities.css").expect(200);

    expect(res.headers["content-type"]).toMatch(/css/);
    expect(res.text).toContain("utility");
  });

  it("GET /assets/blocks.css serves concatenated block CSS", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/blocks.css").expect(200);

    expect(res.headers["content-type"]).toMatch(/css/);
    expect(res.text).toContain("ndb2:block:");
    expect(res.text).toContain("#lucky-result");
  });
});
