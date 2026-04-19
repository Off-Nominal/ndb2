import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "../../../mountWeb";

describe("routes/home", () => {
  it("GET / renders the portal welcome message", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/").expect(200);

    expect(res.text).toContain("welcome to the new ndb2 portal");
    expect(res.text).toContain("/assets/htmx.min.js");
    expect(res.text).toContain("/assets/routes/home/page.client.js");
    expect(res.text).toContain('data-theme="system"');
    expect(res.text).toContain('id="theme-select"');
  });

  it("GET / uses cookie when ndb2_theme is set", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app)
      .get("/")
      .set("Cookie", "ndb2_theme=dark")
      .expect(200);

    expect(res.text).toContain('data-theme="dark"');
  });

  it("GET /home/lucky-number returns an HTML component response for HTMX", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/home/lucky-number").expect(200);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/<span class="lucky-number">\d+<\/span>/);
  });
});
