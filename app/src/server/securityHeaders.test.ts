import { resolveTrustProxy } from "@config";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { configureTrustProxy, installSecurityHeaders } from "./securityHeaders";

function minimalApp() {
  const app = express();
  configureTrustProxy(app, resolveTrustProxy("test", undefined));
  installSecurityHeaders(app);
  app.get("/probe", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("securityHeaders", () => {
  it("sets CSP, clickjacking, and referrer policy", async () => {
    const app = minimalApp();
    const res = await request(app).get("/probe").expect(200);

    const csp = res.headers["content-security-policy"] as string | undefined;
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("does not send Strict-Transport-Security (set HSTS at the TLS terminator)", async () => {
    const app = minimalApp();
    const res = await request(app).get("/probe").expect(200);
    expect(res.headers["strict-transport-security"]).toBeUndefined();
  });

  it("honors explicit TRUST_PROXY=1 via resolveTrustProxy", () => {
    const app = express();
    configureTrustProxy(app, resolveTrustProxy("test", "1"));
    expect(app.get("trust proxy")).toBe(1);
  });

  it("defaults trust proxy to 1 in production when TRUST_PROXY is unset", () => {
    const app = express();
    configureTrustProxy(app, resolveTrustProxy("production", undefined));
    expect(app.get("trust proxy")).toBe(1);
  });

  it("allows TRUST_PROXY=0 to disable trust proxy in production", () => {
    const app = express();
    configureTrustProxy(app, resolveTrustProxy("production", "0"));
    expect(app.get("trust proxy")).toBe(false);
  });
});
