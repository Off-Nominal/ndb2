import type { Client, Guild, GuildMember } from "discord.js";
import { config } from "@config";
import { forEachGuildMemberFetchChunk } from "./guild-members-chunk-fetch.js";
import { getDiscordGatewayClient } from "./discord-js-client";

export type DiscordMemberProfile = {
  displayName: string;
  avatarUrl: string;
};

/** Narrow shape for tests and mapping without importing full GuildMember behavior. */
export type GuildMemberProfileSource = {
  displayName: string;
  displayAvatarURL: (options?: { size?: number }) => string;
};

export function guildMemberToProfile(
  member: GuildMemberProfileSource,
): DiscordMemberProfile {
  return {
    displayName: member.displayName,
    avatarUrl: member.displayAvatarURL({ size: 128 }),
  };
}

/** Narrow shape for tests without full {@link User}. */
export type UserProfileSource = {
  displayName: string | null;
  displayAvatarURL: (options?: { size?: number }) => string;
};

export function userToProfile(user: UserProfileSource): DiscordMemberProfile {
  const displayName = user.displayName?.trim() || "(unknown user)";
  return {
    displayName,
    avatarUrl: user.displayAvatarURL({ size: 128 }),
  };
}

/** When the user is not in the portal guild (e.g. leaderboard row), resolve global user via discord.js (User cache + REST inside the library). */
export async function resolveUserProfileFallback(
  client: Client,
  discordId: string,
): Promise<DiscordMemberProfile | null> {
  try {
    const user = await client.users.fetch(discordId);
    const displayName = user.globalName?.trim() || user.username || user.id;
    return userToProfile({
      displayName,
      displayAvatarURL: (options) => user.displayAvatarURL(options),
    });
  } catch {
    return null;
  }
}

/**
 * Starts {@link resolveUserProfileFallback} without blocking. Use when SSR still defers identity (e.g. HTMX fragment)
 * so `users.fetch` runs in parallel with page render and the Discord.js cache may be warm when the fragment handler runs.
 */
export function prefetchUserProfileFallback(client: Client, discordId: string): void {
  void resolveUserProfileFallback(client, discordId);
}

/**
 * Builds a profile from **`client.users.cache` only** (no REST). Use after guild-only batch misses when the
 * process has already hydrated that user elsewhere (e.g. prior HTMX identity fetch), to avoid deferred UI.
 *
 * Partial users are skipped (`null`) so callers still defer to {@link resolveUserProfileFallback}.
 */
export function memberProfileFromDiscordUsersCache(
  client: Client,
  discordId: string,
): DiscordMemberProfile | null {
  const user = client.users.cache.get(discordId);
  if (!user || user.partial) return null;
  const displayName = user.globalName?.trim() || user.username || user.id;
  return userToProfile({
    displayName,
    displayAvatarURL: (options) => user.displayAvatarURL(options),
  });
}

export async function getPortalGuild(client: Client, guildId: string): Promise<Guild> {
  const cached = client.guilds.cache.get(guildId);
  if (cached) {
    return cached;
  }
  return client.guilds.fetch(guildId);
}

/** Lenient: unknown / API-soft-fail → null (e.g. batch guild lookups for leaderboard rows). */
export async function resolveGuildMember(
  guild: Guild,
  discordId: string,
): Promise<GuildMember | null> {
  const cached = guild.members.cache.get(discordId);
  if (cached) {
    return cached;
  }
  try {
    return await guild.members.fetch({ user: discordId });
  } catch {
    return null;
  }
}

async function requireGuildMember(guild: Guild, discordId: string): Promise<GuildMember> {
  const cached = guild.members.cache.get(discordId);
  if (cached) {
    return cached;
  }
  return guild.members.fetch({ user: discordId });
}

/**
 * Display metadata for a guild member. Propagates Discord/network errors (handled by the web error boundary).
 */
export async function getMemberProfile(discordId: string): Promise<DiscordMemberProfile> {
  const client = getDiscordGatewayClient();
  const guildId = config.discord.webPortal.guildId;
  const guild = await getPortalGuild(client, guildId);
  const member = await requireGuildMember(guild, discordId);
  return guildMemberToProfile(member);
}

/**
 * Resolves **portal guild membership only** for many Discord ids via chunked `guild.members.fetch({ user })`.
 * Dedupes ids; repeated resolution relies on discord.js guild member caching.
 *
 * Missing members (**not in guild** in the gateway reply, or **chunk request threw**) are `null` in the map —
 * callers use placeholders, optional **`client.users.cache`** synthesis ({@link memberProfileFromDiscordUsersCache}), and optional {@link resolveUserProfileFallback} (HTMX hydration).
 */
export async function getMemberProfilesGuildOnly(
  discordIds: string[],
): Promise<Map<string, DiscordMemberProfile | null>> {
  const client = getDiscordGatewayClient();
  const guildId = config.discord.webPortal.guildId;
  const guild = await getPortalGuild(client, guildId);
  const deduped = [...new Set(discordIds)];
  const out = new Map<string, DiscordMemberProfile | null>();

  await forEachGuildMemberFetchChunk(guild, deduped, {
    onChunkSucceeded: async (chunk, collection) => {
      for (const id of chunk) {
        const member = collection.get(id);
        if (member) {
          out.set(id, guildMemberToProfile(member));
        } else {
          out.set(id, null);
        }
      }
    },
    onChunkFailed: async (chunk) => {
      for (const id of chunk) {
        out.set(id, null);
      }
    },
  });

  return out;
}
