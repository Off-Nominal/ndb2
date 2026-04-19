import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { configureTrustProxy, installSecurityHeaders } from "./securityHeaders";

function minimalApp() {
  const app = express();
  configureTrustProxy(app);
  installSecurityHeaders(app);
  app.get("/probe", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("securityHeaders", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY;
  });

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

  it("honors explicit TRUST_PROXY=1", () => {
    process.env.TRUST_PROXY = "1";
    const app = express();
    configureTrustProxy(app);
    expect(app.get("trust proxy")).toBe(1);
  });

  it("defaults trust proxy to 1 in production when TRUST_PROXY is unset", () => {
    const prev = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      delete process.env.TRUST_PROXY;
      const app = express();
      configureTrustProxy(app);
      expect(app.get("trust proxy")).toBe(1);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it("allows TRUST_PROXY=0 to disable trust proxy in production", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevTrust = process.env.TRUST_PROXY;
    try {
      process.env.NODE_ENV = "production";
      process.env.TRUST_PROXY = "0";
      const app = express();
      configureTrustProxy(app);
      expect(app.get("trust proxy")).toBe(false);
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevTrust === undefined) delete process.env.TRUST_PROXY;
      else process.env.TRUST_PROXY = prevTrust;
    }
  });
});
