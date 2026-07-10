import { config } from "@config";
import { getDiscordGatewayClient } from "./discord-js-client.js";
import { getPortalGuild, guildMemberToProfile } from "./discord-member-profile.js";

/** Portal guild member rows sourced from **`guild.members.cache`** (after startup **`members.fetch()`**). */
export type PortalGuildCachedMemberProfile = {
  discordId: string;
  displayName: string;
  avatarUrl: string;
};

/**
 * Lists non-bot portal guild members currently in the Discord.js member cache.
 * Skips partial members; sort is stable for **`localeCompare`** on display name.
 */
export async function listPortalGuildCachedMemberProfiles(): Promise<
  PortalGuildCachedMemberProfile[]
> {
  const client = getDiscordGatewayClient();
  const guildId = config.discord.webPortal.guildId;
  const guild = await getPortalGuild(client, guildId);

  const rows: PortalGuildCachedMemberProfile[] = [];

  for (const member of guild.members.cache.values()) {
    if (member.partial) {
      continue;
    }
    const user = member.user;
    if (!user || user.bot) {
      continue;
    }

    const { displayName, avatarUrl } = guildMemberToProfile(member);
    rows.push({ discordId: member.id, displayName, avatarUrl });
  }

  rows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
  );

  return rows;
}
