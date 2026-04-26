import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mountWeb } from "./mountWeb";

describe("mountWeb", () => {
  it("POST /preferences sets theme and color cookies and redirects (no session)", async () => {
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    mountWeb(app);

    const res = await request(app)
      .post("/preferences")
      .type("form")
      .send({ theme: "dark", colorScheme: "neptune", returnTo: "/login" })
      .expect(303);

    expect(res.headers.location).toBe("/login");
    const setCookie = res.headers["set-cookie"] as string[] | undefined;
    expect(setCookie).toBeDefined();
    const joined = (setCookie ?? []).join(" ");
    expect(joined).toMatch(/ndb2_theme/);
    expect(joined).toMatch(/ndb2_color_scheme/);
  });

  it("POST /preferences with HX-Request sets cookies and signals full refresh (no redirect body)", async () => {
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    mountWeb(app);

    const res = await request(app)
      .post("/preferences")
      .set("HX-Request", "true")
      .type("form")
      .send({ theme: "light", colorScheme: "aurora", returnTo: "/" })
      .expect(200);

    expect(res.headers["hx-refresh"]).toBe("true");
    const setCookie = res.headers["set-cookie"] as string[] | undefined;
    expect((setCookie ?? []).join(" ")).toMatch(/ndb2_theme/);
  });

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
    expect(res.text).toContain("prefers-color-scheme: dark");
    expect(res.text).toContain('html[data-theme="system"]');
    expect(res.text).toContain('html[data-color-scheme="neptune"]');
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
