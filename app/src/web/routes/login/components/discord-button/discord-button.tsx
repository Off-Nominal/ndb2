import { mergeClass } from "../../../../shared/utils/merge_class.js";

const BLOCK = "[ discord-button ]";

export type DiscordButtonProps = {
  /** Post-login path (query param for Discord OAuth). */
  returnTo: string;
  class?: string;
};

/** Link to `GET /auth/discord` with `returnTo` (Discord-branded CTA for the login screen). */
export function DiscordButton(props: DiscordButtonProps): JSX.Element {
  const search = new URLSearchParams({ returnTo: props.returnTo });
  const href = `/auth/discord?${search}`;

  return (
    <a class={mergeClass(BLOCK, props.class)} href={href}>
      Sign in with Discord
    </a>
  );
}
