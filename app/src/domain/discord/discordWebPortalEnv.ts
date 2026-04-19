import { z } from "zod";

/**
 * Web portal authorization: guild id + allowlisted roles from environment.
 * Allowed roles: every `ROLE_ID_*` value (e.g. ROLE_ID_HOST=...).
 */

/** Canonical bot token for Discord REST (and future discord.js). Legacy env names still work. */
export function readDiscordBotToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN?.trim();
}

export function readWebPortalGuildId(): string | undefined {
  return process.env.OFFNOMDISCORD_GUILD_ID?.trim();
}

/** Role ids allowed to use the web app: each `ROLE_ID_*` env value. */
export function readWebPortalAllowedRoleIds(): string[] {
  const ids: string[] = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("ROLE_ID_") && value?.trim()) {
      ids.push(value.trim());
    }
  }
  return ids;
}

export type WebPortalAuthzConfig =
  | {
      ok: true;
      botToken: string;
      guildId: string;
      allowedRoleIds: string[];
    }
  | { ok: false; reason: string };

/**
 * Validates env for “authenticated OAuth user must be in guild + have an allowed role”.
 */
export function readWebPortalAuthzConfig(): WebPortalAuthzConfig {
  const botToken = readDiscordBotToken();
  const guildId = readWebPortalGuildId();
  const allowedRoleIds = readWebPortalAllowedRoleIds();

  if (!botToken) {
    return {
      ok: false,
      reason: "Set DISCORD_BOT_TOKEN for web portal access control.",
    };
  }
  if (!guildId) {
    return {
      ok: false,
      reason: "Set OFFNOMDISCORD_GUILD_ID for web portal access control.",
    };
  }
  if (allowedRoleIds.length === 0) {
    return {
      ok: false,
      reason:
        "Set at least one ROLE_ID_* environment variable with an allowed Discord role id.",
    };
  }

  return { ok: true, botToken, guildId, allowedRoleIds };
}

const DEFAULT_AUTHZ_RECHECK_HOURS = 24;

/** Zod 4: `z.number()` already rejects non-finite values; `.finite()` is deprecated (no-op). */
const webDiscordAuthzRecheckHoursSchema = z.preprocess(
  (val: unknown) => {
    if (val === undefined || val === null) {
      return DEFAULT_AUTHZ_RECHECK_HOURS;
    }
    const t = String(val).trim();
    return t === "" ? DEFAULT_AUTHZ_RECHECK_HOURS : t;
  },
  z.coerce.number().positive(),
);

/**
 * How often to re-verify guild + roles for an active session (`WEB_DISCORD_AUTHZ_RECHECK_HOURS`, default 24).
 */
export function readDiscordAuthzRecheckIntervalMs(): number {
  const parsed = webDiscordAuthzRecheckHoursSchema.safeParse(
    process.env.WEB_DISCORD_AUTHZ_RECHECK_HOURS,
  );
  const hours = parsed.success
    ? parsed.data
    : DEFAULT_AUTHZ_RECHECK_HOURS;
  return hours * 60 * 60 * 1000;
}
