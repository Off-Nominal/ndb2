import { describe, it, expect, beforeEach } from "vitest";
import {
  getReadiness,
  markReady,
  markStartupFailed,
  resetReadinessForTests,
} from "./readiness";

describe("readiness", () => {
  beforeEach(() => {
    resetReadinessForTests();
  });

  it("starts not ready", () => {
    expect(getReadiness()).toEqual({ ready: false, error: null });
  });

  it("marks ready after bootstrap", () => {
    markReady();
    expect(getReadiness()).toEqual({ ready: true, error: null });
  });

  it("records startup failure", () => {
    markStartupFailed("database down");
    expect(getReadiness()).toEqual({ ready: false, error: "database down" });
  });
});
