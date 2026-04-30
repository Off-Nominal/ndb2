import type { Client, Guild, GuildMember } from "discord.js";
import { config } from "@config";
import { fetchDiscordUserProfileRest } from "./discord-gateway";
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

/** When the user is not in the portal guild (e.g. leaderboard row), resolve global user. */
export async function resolveUserProfileFallback(
  client: Client,
  discordId: string,
): Promise<DiscordMemberProfile | null> {
  try {
    const user = await client.users.fetch(discordId, { force: true });
    const displayName = user.globalName?.trim() || user.username || user.id;
    return userToProfile({
      displayName,
      displayAvatarURL: (options) => user.displayAvatarURL(options),
    });
  } catch {
    // Same Bot REST as guild lookups — avoids stale/partial User cache issues.
    return fetchDiscordUserProfileRest(config.discord.webPortal.botToken, discordId);
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
 * guild member, falls back to {@link User} (global name + avatar) via `client.users.fetch`.
 * Dedupes input ids.
 */
export async function getMemberProfiles(
  discordIds: string[],
): Promise<Map<string, DiscordMemberProfile | null>> {
  const client = getDiscordGatewayClient();
  const guildId = config.discord.webPortal.guildId;
  const guild = await getPortalGuild(client, guildId);
  const deduped = [...new Set(discordIds)];
  const out = new Map<string, DiscordMemberProfile | null>();

  await Promise.all(
    deduped.map(async (id) => {
      const member = await resolveGuildMember(guild, id);
      if (member) {
        out.set(id, guildMemberToProfile(member));
        return;
      }
      out.set(id, await resolveUserProfileFallback(client, id));
    }),
  );

  return out;
}
