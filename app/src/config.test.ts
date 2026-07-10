import { z, ZodError } from "zod";
import { describe, expect, it } from "vitest";
import {
  collectWebAdminRoleIdsFromEnv,
  collectWebPortalRoleIdsFromEnv,
  formatConfigError,
  resolveTrustProxy,
} from "./config";

describe("collectWebPortalRoleIdsFromEnv", () => {
  it("collects ROLE_ID_* values", () => {
    const env = {
      ROLE_ID_HOST: "111",
      ROLE_ID_MODS: "222",
      OTHER: "x",
    } as NodeJS.ProcessEnv;
    expect(collectWebPortalRoleIdsFromEnv(env)).toEqual(["111", "222"]);
  });
});

describe("collectWebAdminRoleIdsFromEnv", () => {
  it("collects only ROLE_ID_HOST and ROLE_ID_MODS", () => {
    const env = {
      ROLE_ID_HOST: "111",
      ROLE_ID_MODS: "222",
      ROLE_ID_TEST: "333",
    } as NodeJS.ProcessEnv;
    expect(collectWebAdminRoleIdsFromEnv(env)).toEqual(["111", "222"]);
  });

  it("returns a single id when only one admin role is set", () => {
    const env = {
      ROLE_ID_HOST: "111",
    } as NodeJS.ProcessEnv;
    expect(collectWebAdminRoleIdsFromEnv(env)).toEqual(["111"]);
  });
});

describe("formatConfigError", () => {
  it("labels issues with environment variable names", () => {
    const schema = z.object({
      databaseUrl: z.string().min(1),
    });
    const result = schema.safeParse({ databaseUrl: undefined });
    expect(result.success).toBe(false);
    const text = formatConfigError(result.error as ZodError);
    expect(text).toContain("DATABASE_URL");
    expect(text).toContain("Required but not set");
  });

  it("includes Zod’s message when input is present but invalid", () => {
    const schema = z.object({
      gmPredictionUpdateWindowHours: z.coerce.number().positive(),
    });
    const result = schema.safeParse({ gmPredictionUpdateWindowHours: "nope" });
    expect(result.success).toBe(false);
    const text = formatConfigError(result.error as ZodError);
    expect(text).toContain("GM_PREDICTION_UPDATE_WINDOW_HOURS");
    expect(text).toMatch(/Invalid input|expected number|NaN/i);
  });
});

describe("resolveTrustProxy", () => {
  it("defaults trust proxy to 1 in production when TRUST_PROXY is unset", () => {
    expect(resolveTrustProxy("production", undefined)).toEqual({
      apply: true,
      hops: 1,
    });
  });

  it("does not apply in non-production when unset", () => {
    expect(resolveTrustProxy("test", undefined)).toEqual({ apply: false });
  });

  it("honors TRUST_PROXY=1", () => {
    expect(resolveTrustProxy("test", "1")).toEqual({ apply: true, hops: 1 });
  });

  it("honors TRUST_PROXY=0", () => {
    expect(resolveTrustProxy("production", "0")).toEqual({ apply: false });
  });
});
