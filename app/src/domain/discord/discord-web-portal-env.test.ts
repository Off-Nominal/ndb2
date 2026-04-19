import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readDiscordAuthzRecheckIntervalMs,
  readWebPortalAllowedRoleIds,
  readWebPortalAuthzConfig,
} from "./discord-web-portal-env";

describe("readWebPortalAllowedRoleIds", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("collects ROLE_ID_* values", () => {
    vi.stubEnv("ROLE_ID_HOST", "111");
    vi.stubEnv("ROLE_ID_MODS", "222");
    expect(readWebPortalAllowedRoleIds()).toEqual(["111", "222"]);
  });
});

describe("readDiscordAuthzRecheckIntervalMs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to 24 hours", () => {
    expect(readDiscordAuthzRecheckIntervalMs()).toBe(24 * 60 * 60 * 1000);
  });

  it("reads WEB_DISCORD_AUTHZ_RECHECK_HOURS", () => {
    vi.stubEnv("WEB_DISCORD_AUTHZ_RECHECK_HOURS", "48");
    expect(readDiscordAuthzRecheckIntervalMs()).toBe(48 * 60 * 60 * 1000);
  });

  it("falls back to 24 hours when the value is not a positive number", () => {
    vi.stubEnv("WEB_DISCORD_AUTHZ_RECHECK_HOURS", "not-a-number");
    expect(readDiscordAuthzRecheckIntervalMs()).toBe(24 * 60 * 60 * 1000);
  });
});

describe("readWebPortalAuthzConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns ok when bot, guild, and roles are present", () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", "token");
    vi.stubEnv("OFFNOMDISCORD_GUILD_ID", "guild");
    vi.stubEnv("ROLE_ID_A", "r1");
    expect(readWebPortalAuthzConfig()).toEqual({
      ok: true,
      botToken: "token",
      guildId: "guild",
      allowedRoleIds: ["r1"],
    });
  });

  it("uses DISCORD_BOT_TOKEN", () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", "primary");
    vi.stubEnv("OFFNOMDISCORD_GUILD_ID", "g");
    vi.stubEnv("ROLE_ID_A", "r1");
    expect(readWebPortalAuthzConfig()).toMatchObject({
      ok: true,
      botToken: "primary",
    });
  });
});
