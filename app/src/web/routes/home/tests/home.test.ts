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
  });

  it("GET /home/lucky-number returns an HTML component response for HTMX", async () => {
    const app = express();
    mountWeb(app);

    const res = await request(app).get("/home/lucky-number").expect(200);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/<span class="lucky-number">\d+<\/span>/);
  });
});
