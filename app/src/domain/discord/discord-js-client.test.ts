import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetDiscordGatewayClientForTests,
  __setConnectLoopRunningForTests,
  __setDiscordGatewayClientForTests,
  applyDiscordGatewayRetryJitter,
  baseDiscordGatewayRetryDelayMs,
  getDiscordGatewayClient,
  getDiscordGatewayClientIfReady,
  getDiscordGatewayStatus,
  isDiscordGatewayReady,
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

  it("returns connected when the client is ready", () => {
    __setDiscordGatewayClientForTests({ isReady: () => true });
    expect(getDiscordGatewayStatus()).toBe("connected");
  });

  it("returns connecting while the background loop is running", () => {
    __setConnectLoopRunningForTests(true);
    expect(getDiscordGatewayStatus()).toBe("connecting");
  });

  it("prefers connected over connecting when the client is ready", () => {
    __setDiscordGatewayClientForTests({ isReady: () => true });
    __setConnectLoopRunningForTests(true);
    expect(getDiscordGatewayStatus()).toBe("connected");
  });
});

describe("isDiscordGatewayReady", () => {
  afterEach(() => {
    __resetDiscordGatewayClientForTests();
  });

  it("is false when disconnected", () => {
    expect(isDiscordGatewayReady()).toBe(false);
  });

  it("is true only when status is connected", () => {
    __setDiscordGatewayClientForTests({ isReady: () => true });
    expect(isDiscordGatewayReady()).toBe(true);
  });
});

describe("getDiscordGatewayClient accessors", () => {
  afterEach(() => {
    __resetDiscordGatewayClientForTests();
  });

  it("getDiscordGatewayClient throws when not started", () => {
    expect(() => getDiscordGatewayClient()).toThrow(
      "Discord gateway client not started",
    );
  });

  it("getDiscordGatewayClient returns the live client", () => {
    const mock = { isReady: () => true };
    __setDiscordGatewayClientForTests(mock);
    expect(getDiscordGatewayClient()).toBe(mock);
  });

  it("getDiscordGatewayClientIfReady returns null when absent or not ready", () => {
    expect(getDiscordGatewayClientIfReady()).toBeNull();
    __setDiscordGatewayClientForTests({ isReady: () => false });
    expect(getDiscordGatewayClientIfReady()).toBeNull();
  });

  it("getDiscordGatewayClientIfReady returns the client when ready", () => {
    const mock = { isReady: () => true };
    __setDiscordGatewayClientForTests(mock);
    expect(getDiscordGatewayClientIfReady()).toBe(mock);
  });
});
