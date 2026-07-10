/**
 * Discord CDN default (blurple) avatars for users without a custom avatar.
 *
 * @see https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints — “Default User Avatar”
 * (`embed/avatars/[index].png`). For the current username system: `index === (user_id >> 22) % 6`.
 */

/** `embed/avatars/0.png` — safe last resort when a snowflake string cannot be parsed. */
export const DISCORD_EMBED_AVATAR_PLACEHOLDER_URL =
  "https://cdn.discordapp.com/embed/avatars/0.png" as const;

export type DiscordAvatarUrlInput = string | null | undefined | false;

/**
 * Resolves the `<img src>` for a Discord user avatar: custom CDN URL when present,
 * otherwise the default embed avatar for the snowflake (or {@link DISCORD_EMBED_AVATAR_PLACEHOLDER_URL}).
 */
export function resolveDiscordAvatarUrl(
  discordUserId: string,
  customUrl?: DiscordAvatarUrlInput,
): string {
  if (typeof customUrl === "string" && customUrl.trim().length > 0) {
    return customUrl.trim();
  }
  return (
    discordDefaultEmbedAvatarUrl(discordUserId) ?? DISCORD_EMBED_AVATAR_PLACEHOLDER_URL
  );
}

/**
 * Returns PNG URL on `cdn.discordapp.com`, or `null` if `discordUserId` is not a usable numeric snowflake string.
 */
export function discordDefaultEmbedAvatarUrl(discordUserId: string): string | null {
  const id = discordUserId.trim();
  if (id.length === 0 || !/^\d+$/.test(id)) {
    return null;
  }
  try {
    const n = BigInt(id);
    const index = Number((n >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return null;
  }
}
