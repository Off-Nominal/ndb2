import {
  resolveDiscordAvatarUrl,
  type DiscordAvatarUrlInput,
} from "@domain/discord";

export type DiscordAvatarUrl = DiscordAvatarUrlInput;

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
 * Square Discord user avatar `<img>`: custom `url` when set, otherwise the default embed PNG
 * for {@link DiscordAvatarProps.discordUserId} (see {@link resolveDiscordAvatarUrl}).
 */
export function DiscordAvatar(props: DiscordAvatarProps): JSX.Element {
  const size = props.size ?? 20;
  const frameStyle = `--discord-avatar-size:${size}px`;
  const imgSrc = resolveDiscordAvatarUrl(props.discordUserId, props.url);

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
