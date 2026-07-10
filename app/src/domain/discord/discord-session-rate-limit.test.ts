import { describe, it, expect } from "vitest";
import {
  discordSessionRateLimitDelayMs,
  isDiscordSessionRateLimitError,
} from "./discord-session-rate-limit";

describe("discord session rate limit helpers", () => {
  const rateLimitError = new Error(
    "Not enough sessions remaining to spawn 1 shards; only 0 remaining; resets at 2026-07-10T11:09:16.048Z",
  );

  it("detects session rate-limit errors", () => {
    expect(isDiscordSessionRateLimitError(rateLimitError)).toBe(true);
    expect(isDiscordSessionRateLimitError(new Error("other"))).toBe(false);
  });

  it("computes delay until the reset timestamp", () => {
    const now = Date.parse("2026-07-10T10:17:52.000Z");
    expect(discordSessionRateLimitDelayMs(rateLimitError, now)).toBe(
      Date.parse("2026-07-10T11:09:16.048Z") - now + 1_000,
    );
  });

  it("returns null for unrelated errors", () => {
    expect(discordSessionRateLimitDelayMs(new Error("nope"))).toBeNull();
  });
});
