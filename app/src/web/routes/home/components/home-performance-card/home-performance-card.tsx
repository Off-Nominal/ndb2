import type { DiscordMemberProfile } from "@domain/discord";
import { CardScreenElement } from "@web/shared/components/card-screen-element";

export type HomePerformanceCardProps = {
  discordProfile: DiscordMemberProfile;
};

export function HomePerformanceCard(
  props: HomePerformanceCardProps,
): JSX.Element {
  return (
    <CardScreenElement headingElement="h2" heading="Performance">
      <p class="[ stack ]">
        <span>
          <img
            src={props.discordProfile.avatarUrl}
            alt=""
            width={36}
            height={36}
            loading="lazy"
          />
          <span>
            Signed in as{" "}
            <strong>{props.discordProfile.displayName}</strong>. Have a nice day.
          </span>
        </span>
      </p>
    </CardScreenElement>
  );
}
