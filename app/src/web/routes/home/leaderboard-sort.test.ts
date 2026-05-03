import { describe, expect, it } from "vitest";
import {
  homeLeaderboardPlayerIdentityUrl,
  parseHomeLeaderboardPlayerIdentityQuery,
} from "./leaderboard-sort";

describe("parseHomeLeaderboardPlayerIdentityQuery", () => {
  it("accepts a 17+ digit discord snowflake", () => {
    const parsed = parseHomeLeaderboardPlayerIdentityQuery({
      discord_id: "111111111111111111",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.discord_id).toBe("111111111111111111");
    }
  });

  it("rejects short discord_id", () => {
    expect(parseHomeLeaderboardPlayerIdentityQuery({ discord_id: "12" }).success).toBe(
      false,
    );
  });
});

describe("homeLeaderboardPlayerIdentityUrl", () => {
  it("encodes discord_id in query string", () => {
    expect(homeLeaderboardPlayerIdentityUrl("99999999999999999")).toBe(
      "/home/leaderboard/player-identity?discord_id=99999999999999999",
    );
  });
});
