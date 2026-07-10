import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetDiscordGatewayClientForTests,
  applyDiscordGatewayRetryJitter,
  baseDiscordGatewayRetryDelayMs,
  getDiscordGatewayStatus,
  isLikelyPermanentDiscordAuthError,
} from "./discord-js-client";

describe("discord gateway retry helpers", () => {
  it("uses exponential backoff capped at 30s for generic errors", () => {
    expect(baseDiscordGatewayRetryDelayMs(1, new Error("network"))).toBe(2_000);
    expect(baseDiscordGatewayRetryDelayMs(5, new Error("network"))).toBe(30_000);
    expect(baseDiscordGatewayRetryDelayMs(10, new Error("network"))).toBe(30_000);
  });

  it("prefers session rate-limit delay when present", () => {
    const err = new Error(
      "Not enough sessions remaining to spawn 1 shards; only 0 remaining; resets at 2026-07-10T11:09:16.048Z",
    );
    const now = Date.parse("2026-07-10T10:17:52.000Z");
    expect(baseDiscordGatewayRetryDelayMs(1, err, now)).toBe(
      Date.parse("2026-07-10T11:09:16.048Z") - now + 1_000,
    );
  });

  it("does not add jitter for session rate limits", () => {
    const delay = 12_345;
    expect(applyDiscordGatewayRetryJitter(delay, true)).toBe(delay);
  });

  it("adds jitter for non-rate-limit delays", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(applyDiscordGatewayRetryJitter(1_000, false)).toBe(1_250);
    vi.mocked(Math.random).mockRestore();
  });

  it("detects likely permanent auth errors", () => {
    expect(isLikelyPermanentDiscordAuthError("401 Unauthorized")).toBe(true);
    expect(isLikelyPermanentDiscordAuthError("TOKEN_INVALID")).toBe(true);
    expect(isLikelyPermanentDiscordAuthError("network timeout")).toBe(false);
  });
});

describe("getDiscordGatewayStatus", () => {
  afterEach(() => {
    __resetDiscordGatewayClientForTests();
  });

  it("starts disconnected before any connect attempt", () => {
    expect(getDiscordGatewayStatus()).toBe("disconnected");
  });
});
