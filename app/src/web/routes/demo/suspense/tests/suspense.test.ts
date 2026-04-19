import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "../../../../mountWeb";

describe("routes/demo/suspense", () => {
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
    expect(res.text).toContain('data-theme="system"');
  });
});
