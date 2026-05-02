export type AvatarUrl = string | null | undefined | false;

/** True when {@link Avatar} should render the `<img>` branch (trimmed URL only). */
function isAvatarImgUrl(url: AvatarUrl): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

function avatarFallbackLetter(label: string): string {
  const letter = label.trim().slice(0, 1).toUpperCase();
  return letter.length > 0 ? letter : "?";
}

export interface AvatarProps {
  /** Edge length in CSS pixels (image and fallback). Default `20`. */
  size?: number;
  /** CDN or remote URL when present after trim; any other value shows the textual fallback. */
  url?: AvatarUrl;
  /**
   * Drives fallback glyph (first trimmed character, uppercased) and complements the image semantically when
   * `alt` is omitted (decorative contexts should still pass meaningful `label`).
   */
  label: string;
  /** Passed to `<img>` when URL is usable; omit or `''` when decorative next to visible `label`. */
  alt?: string;
}

/**
 * Square avatar: profile image when `url` resolves to non-empty trimmed string,
 * otherwise an initial from {@link AvatarProps.label}. Size is set with {@link AvatarProps.size} (px).
 */
export function Avatar(props: AvatarProps): JSX.Element {
  const size = props.size ?? 20;
  const frameStyle = `--avatar-size:${size}px`;

  if (isAvatarImgUrl(props.url)) {
    return (
      <span class="[ avatar ]" style={frameStyle}>
        <img
          src={props.url}
          alt={props.alt ?? ""}
          width={size}
          height={size}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span class="[ avatar ]" style={frameStyle}>
      <span class="[ avatar-fallback ]" aria-hidden="true">
        {avatarFallbackLetter(props.label)}
      </span>
    </span>
  );
}
