import type { DiscordMemberProfile } from "@domain/discord";
import { DiscordAvatar } from "@web/shared/components/discord-avatar";
import { mergeClass } from "@web/shared/utils/merge_class.js";

export type HomePerformanceIdentityCardProps = {
  discordProfile: DiscordMemberProfile;
  /** Guild member snowflake for {@link DiscordAvatar} fallback CDN and readout. */
  discordUserId: string;
  class?: string;
};

/** HUD strip: avatar, predictor overline + Discord snowflake, display name, status band. */
export function HomePerformanceIdentityCard(
  props: HomePerformanceIdentityCardProps,
): JSX.Element {
  return (
    <div
      class={mergeClass(
        "[ screen-element-secondary ] [ home-performance-identity-card ]",
        props.class,
      )}
      role="group"
      aria-label={`Predictor: ${props.discordProfile.displayName}`}
    >
      <div class="home-performance-identity-card__portrait">
        <DiscordAvatar
          discordUserId={props.discordUserId}
          url={props.discordProfile.avatarUrl}
          size={50}
          alt=""
        />
      </div>
      <div class={"[ stack ] home-performance-identity-card__readout"}>
        <span class="home-performance-identity-card__heading">
          <span class={"[ overline ]"}>Predictor</span>
          <code class="home-performance-identity-card__snowflake">{props.discordUserId}</code>
        </span>

        <strong class={"home-performance-identity-card__name"}>
          <span class="home-performance-identity-card__caret" aria-hidden="true">
            ›
          </span>
          {props.discordProfile.displayName}
        </strong>

        <span class="home-performance-identity-card__band">
          SESSION VERIFIED
        </span>
      </div>
    </div>
  );
}
