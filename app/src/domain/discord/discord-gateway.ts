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
