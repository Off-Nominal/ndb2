import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import pool from "./index";
import { waitForDatabase } from "./wait-for-database";

describe("waitForDatabase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves on first successful connection", async () => {
    const release = vi.fn();
    vi.spyOn(pool, "connect").mockResolvedValue({ release } as never);

    await expect(waitForDatabase()).resolves.toBeUndefined();
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("retries until the database is reachable", async () => {
    const release = vi.fn();
    vi.spyOn(pool, "connect")
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce({ release } as never);

    const pending = waitForDatabase({
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 100,
    });

    await vi.advanceTimersByTimeAsync(100);
    await expect(pending).resolves.toBeUndefined();
    expect(pool.connect).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    vi.spyOn(pool, "connect").mockRejectedValue(new Error("still down"));

    const pending = waitForDatabase({
      maxAttempts: 2,
      initialDelayMs: 50,
      maxDelayMs: 50,
    });

    const assertion = expect(pending).rejects.toThrow(
      "Database unavailable after 2 attempts (last error: still down)",
    );

    await vi.runAllTimersAsync();
    await assertion;
    expect(pool.connect).toHaveBeenCalledTimes(2);
  });
});
