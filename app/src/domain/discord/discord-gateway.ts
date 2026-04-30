/**
 * Server-side Discord Bot REST API — single entry point for guild/member lookups.
 * Swap internals for discord.js later without changing call sites (see docs/frontend/discord-client.md).
 */

const DISCORD_API_V10 = "https://discord.com/api/v10";

export type GuildMemberSummary = {
  roles: string[];
};

/**
 * Returns guild member role ids, or `null` if the user is not in the guild (404).
 */
export async function fetchGuildMember(
  botToken: string,
  guildId: string,
  discordUserId: string,
): Promise<GuildMemberSummary | null> {
  const url = `${DISCORD_API_V10}/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(discordUserId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord guild member request failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { roles?: string[] };
  return { roles: json.roles ?? [] };
}

/** Default user avatar index (Discord CDN) for new-username users. */
function defaultAvatarIndexFromSnowflake(userId: string): number {
  return Number((BigInt(userId) >> 22n) % 6n);
}

function discordAvatarUrl(userId: string, avatarHash: string | null | undefined): string {
  if (!avatarHash) {
    const i = defaultAvatarIndexFromSnowflake(userId);
    return `https://cdn.discordapp.com/embed/avatars/${i}.png`;
  }
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=128`;
}

/**
 * `GET /users/{id}` — global display name + avatar (works for users not in the portal guild).
 * Returns `null` on 404 or non-OK response (no throw).
 */
export async function fetchDiscordUserProfileRest(
  botToken: string,
  discordUserId: string,
): Promise<{ displayName: string; avatarUrl: string } | null> {
  const url = `${DISCORD_API_V10}/users/${encodeURIComponent(discordUserId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!res.ok) {
    return null;
  }

  const json = (await res.json()) as {
    id?: string;
    username?: string;
    global_name?: string | null;
    avatar?: string | null;
  };

  if (!json.id || typeof json.username !== "string") {
    return null;
  }

  const displayName = json.global_name?.trim() || json.username;

  return {
    displayName,
    avatarUrl: discordAvatarUrl(json.id, json.avatar),
  };
}
