import type { Client, Guild, GuildMember } from "discord.js";
import { config } from "@config";
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

export async function getPortalGuild(client: Client, guildId: string): Promise<Guild> {
  const cached = client.guilds.cache.get(guildId);
  if (cached) {
    return cached;
  }
  return client.guilds.fetch(guildId);
}

/** Lenient: unknown / API-soft-fail → null (e.g. {@link getMemberProfiles} rows not in guild). */
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
 * Resolves display metadata for many ids. Prefer guild nicknames/avatars; if the user is not a
 * guild member, falls back to discord.js {@link Client#users} (`fetch` + in-library REST + User cache).
 * Dedupes input ids.
 *
 * Uses `guild.members.fetch({ user: ids })` in batches (Discord caps bulk member requests; app data
 * max is 100 rows). Falls back to per-id fetches if a batch fails; user lookups stay concurrency-limited.
 */
const PROFILE_BATCH_CACHE_TTL_MS = 5 * 60 * 1000;
const PROFILE_BATCH_CACHE_MAX = 500;
const PROFILE_FETCH_CONCURRENCY = 5;
/** Discord bulk guild-member lookup limit (aligned with leaderboard `per_page` max). */
const GUILD_MEMBERS_FETCH_BY_USERS_LIMIT = 100;

type CachedBatchProfile = DiscordMemberProfile | null;

const memberProfilesBatchCache = new Map<
  string,
  { expires: number; profile: CachedBatchProfile }
>();

function batchCacheDisabledForTests(): boolean {
  return process.env.VITEST === "true";
}

function batchCacheGet(discordId: string): CachedBatchProfile | undefined {
  if (batchCacheDisabledForTests()) return undefined;
  const row = memberProfilesBatchCache.get(discordId);
  if (row === undefined) return undefined;
  if (Date.now() > row.expires) {
    memberProfilesBatchCache.delete(discordId);
    return undefined;
  }
  return row.profile;
}

function batchCacheSet(discordId: string, profile: CachedBatchProfile): void {
  if (batchCacheDisabledForTests()) return;
  if (memberProfilesBatchCache.size >= PROFILE_BATCH_CACHE_MAX) {
    const oldestKey = memberProfilesBatchCache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) memberProfilesBatchCache.delete(oldestKey);
  }
  memberProfilesBatchCache.set(discordId, {
    expires: Date.now() + PROFILE_BATCH_CACHE_TTL_MS,
    profile,
  });
}

async function forEachWithConcurrencyLimit<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const n = Math.min(Math.max(1, limit), items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next;
      if (i >= items.length) return;
      next += 1;
      await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
}

export async function getMemberProfiles(
  discordIds: string[],
): Promise<Map<string, DiscordMemberProfile | null>> {
  const client = getDiscordGatewayClient();
  const guildId = config.discord.webPortal.guildId;
  const guild = await getPortalGuild(client, guildId);
  const deduped = [...new Set(discordIds)];
  const out = new Map<string, DiscordMemberProfile | null>();

  const needsGuildResolve: string[] = [];
  for (const id of deduped) {
    const hit = batchCacheGet(id);
    if (hit !== undefined) {
      out.set(id, hit);
    } else {
      needsGuildResolve.push(id);
    }
  }

  for (let i = 0; i < needsGuildResolve.length; i += GUILD_MEMBERS_FETCH_BY_USERS_LIMIT) {
    const chunk = needsGuildResolve.slice(i, i + GUILD_MEMBERS_FETCH_BY_USERS_LIMIT);
    try {
      const collection = await guild.members.fetch({ user: chunk });
      const needUserFallback: string[] = [];
      for (const id of chunk) {
        const member = collection.get(id);
        if (member) {
          const profile = guildMemberToProfile(member);
          batchCacheSet(id, profile);
          out.set(id, profile);
        } else {
          needUserFallback.push(id);
        }
      }
      await forEachWithConcurrencyLimit(
        needUserFallback,
        PROFILE_FETCH_CONCURRENCY,
        async (id) => {
          const profile = await resolveUserProfileFallback(client, id);
          batchCacheSet(id, profile);
          out.set(id, profile);
        },
      );
    } catch {
      await forEachWithConcurrencyLimit(chunk, PROFILE_FETCH_CONCURRENCY, async (id) => {
        const hit = batchCacheGet(id);
        if (hit !== undefined) {
          out.set(id, hit);
          return;
        }
        const member = await resolveGuildMember(guild, id);
        let profile: CachedBatchProfile;
        if (member) {
          profile = guildMemberToProfile(member);
        } else {
          profile = await resolveUserProfileFallback(client, id);
        }
        batchCacheSet(id, profile);
        out.set(id, profile);
      });
    }
  }

  return out;
}
