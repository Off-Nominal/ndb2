import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { themePreferenceMiddleware } from "./theme-preference";
import {
  webErrorHandler,
  wrapWebRouteWithErrorBoundary,
} from "./error-boundary";

describe("webErrorBoundary", () => {
  it("wrapWebRouteWithErrorBoundary surfaces errors to webErrorHandler as HTML 500", async () => {
    const app = express();
    const router = express.Router();
    router.use(themePreferenceMiddleware);
    router.get(
      "/boom",
      wrapWebRouteWithErrorBoundary(async () => {
        throw new Error("intentional test failure");
      }),
    );
    router.use(webErrorHandler);
    app.use(router);

    const res = await request(app).get("/boom").expect(500);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Something went wrong");
    expect(res.text).toContain('href="/"');
  });

  it("webErrorHandler returns a fragment when HX-Request is set", async () => {
    const app = express();
    const router = express.Router();
    router.use(themePreferenceMiddleware);
    router.get(
      "/boom",
      wrapWebRouteWithErrorBoundary(async () => {
        throw new Error("intentional htmx test failure");
      }),
    );
    router.use(webErrorHandler);
    app.use(router);

    const res = await request(app)
      .get("/boom")
      .set("HX-Request", "true")
      .expect(500);

    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain('role="alert"');
    expect(res.text).not.toContain("<html");
  });
});
