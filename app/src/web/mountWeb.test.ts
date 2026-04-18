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
});
