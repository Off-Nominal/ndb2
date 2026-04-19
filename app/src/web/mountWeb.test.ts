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
});
