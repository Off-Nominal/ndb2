import express from "express";
import request from "supertest";
import { mountWeb } from "./mountWeb";

describe("mountWeb", () => {
  it("GET / renders the portal welcome message", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/").expect(200);

    expect(res.text).toContain("welcome to the new ndb2 portal");
    expect(res.text).toContain("/assets/htmx.min.js");
  });

  it("GET /assets/htmx.min.js serves the HTMX script", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/assets/htmx.min.js").expect(200);

    expect(res.headers["content-type"]).toMatch(/javascript/);
    expect(res.text.length).toBeGreaterThan(100);
  });

  it("GET /home/lucky-number returns an HTML component response for HTMX", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/home/lucky-number").expect(200);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/<span class="lucky-number">\d+<\/span>/);
  });

  it("GET /demo/suspense streams a full HTML page with Suspense fallbacks and resolved chunks", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/demo/suspense").expect(200);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Loading block A");
    expect(res.text).toContain("Loading block B");
    expect(res.text).toContain('class="suspense-loaded"');
    expect(res.text).toContain("$KITA_RC");
    expect(res.text).toContain("750");
    expect(res.text).toContain("1750");
  });
});
