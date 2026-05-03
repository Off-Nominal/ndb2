import type { Collection, Guild, GuildMember } from "discord.js";

/**
 * Discord Gateway `Request GuildMembers` **`user_ids`** cap (bulk fetch by snowflake list).
 *
 * discord.js forwards the full array in one opcode — callers must chunk above this limit.
 *
 * @see https://discord.com/developers/docs/topics/gateway-events#request-guild-members
 */
export const DISCORD_GATEWAY_GUILD_MEMBERS_USER_IDS_MAX = 100;

export type ChunkedGuildMembersFetchHooks = Readonly<{
  /** Max user ids per `guild.members.fetch({ user })` chunk (gateway limit). */
  chunkSize?: number;
  onChunkSucceeded: (
    chunk: readonly string[],
    collection: Collection<string, GuildMember>,
  ) => Promise<void>;
  onChunkFailed: (chunk: readonly string[]) => Promise<void>;
}>;

/**
 * Iterates **`userIds`** in gateway-sized slices, calling **`guild.members.fetch({ user })`** per slice.
 *
 * Implements try / catch per chunk: **`onChunkSucceeded`** after bulk fetch, **`onChunkFailed`** when bulk throws (e.g. timeout).
 */
export async function forEachGuildMemberFetchChunk(
  guild: Guild,
  userIds: readonly string[],
  hooks: ChunkedGuildMembersFetchHooks,
): Promise<void> {
  const chunkSize =
    hooks.chunkSize !== undefined ? hooks.chunkSize : DISCORD_GATEWAY_GUILD_MEMBERS_USER_IDS_MAX;

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    try {
      const collection = await guild.members.fetch({ user: [...chunk] });
      await hooks.onChunkSucceeded(chunk, collection);
    } catch {
      await hooks.onChunkFailed(chunk);
    }
  }
}
