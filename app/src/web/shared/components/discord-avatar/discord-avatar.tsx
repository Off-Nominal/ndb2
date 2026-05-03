import {
  discordDefaultEmbedAvatarUrl,
  DISCORD_EMBED_AVATAR_PLACEHOLDER_URL,
} from "@domain/discord";

export type DiscordAvatarUrl = string | null | undefined | false;

/** True when {@link DiscordAvatar} should prefer a custom CDN / remote `<img>` `src`. */
function isDiscordAvatarImgUrl(url: DiscordAvatarUrl): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

export interface DiscordAvatarProps {
  /** Edge length in CSS pixels. Default `20`. */
  size?: number;
  /** Discord snowflake; used with [`embed/avatars`](https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints) when `url` is absent. */
  discordUserId: string;
  /** Custom avatar URL when present after trim; otherwise the default Discord embed PNG for {@link DiscordAvatarProps.discordUserId}. */
  url?: DiscordAvatarUrl;
  /** Passed through to `<img>`; default `''` for decorative avatars beside visible names. */
  alt?: string;
}

/**
 * Square Discord user avatar `<img>`: custom `url` when set, otherwise `embed/avatars` `(id >> 22) % 6`
 * (placeholder `embed/avatars/0.png` only if the id string does not parse).
 */
export function DiscordAvatar(props: DiscordAvatarProps): JSX.Element {
  const size = props.size ?? 20;
  const frameStyle = `--discord-avatar-size:${size}px`;

  const customUrl = isDiscordAvatarImgUrl(props.url) ? props.url.trim() : null;
  const imgSrc =
    customUrl ??
    (discordDefaultEmbedAvatarUrl(props.discordUserId) ?? DISCORD_EMBED_AVATAR_PLACEHOLDER_URL);

  return (
    <span class="[ discord-avatar ]" style={frameStyle}>
      <img
        src={imgSrc}
        alt={props.alt ?? ""}
        width={size}
        height={size}
        loading="lazy"
      />
    </span>
  );
}
