import type { DiscordMemberProfile } from "@domain/discord";
import { CardScreenElement } from "@web/shared/components/card-screen-element";
import { formatNumber } from "@web/shared/utils/format_number";
import { PerformanceBlock } from "./performance-block";
import { PerformanceMetricRow } from "./performance-metric-row";
import { HorizontalDivider } from "@web/shared/components/horizontal-divider";

/** Snapshot wired from {@link API.Entities.Results.UserSeasonResult}; markup-only breakdowns. */
export interface HomePerformanceSnapshot {
  total_participants: number;
  points: {
    rank: number | null;
    net: number;
    rewards: number;
    penalties: number;
  };
  predictions: {
    rank: number | null;
    successful: number;
    failed: number;
    open: number;
    closed: number;
    checking: number;
    retired: number;
  };
  bets: {
    rank: number | null;
    successful: number;
    failed: number;
    pending: number;
    retired: number;
    invalid: number;
  };
}

export type HomePerformanceCardPerformance =
  | { state: "no-activity"; participantCount: number }
  | { state: "ready"; data: HomePerformanceSnapshot };

export type HomePerformanceCardProps = {
  discordProfile: DiscordMemberProfile;
  performance: HomePerformanceCardPerformance;
};

export function HomePerformanceCard(props: HomePerformanceCardProps): JSX.Element {
  const perf = props.performance;

  return (
    <CardScreenElement
      headingElement="h2"
      heading="Performance"
      class="[ home-performance-card ]"
    >
      <div class="[ stack ]">
        <p class="home-performance-card__identity">
          <img
            src={props.discordProfile.avatarUrl}
            alt=""
            width={36}
            height={36}
            loading="lazy"
          />
          <span>
            Signed in as{" "}
            <strong>{props.discordProfile.displayName}</strong>
          </span>
        </p>

        {perf.state === "no-activity" ? (
          <p class={"[ center ] home-performance-card__empty"}>
            No activity yet this season — make a prediction, bet, or vote to show up with{" "}
            {formatNumber(perf.participantCount)} participant
            {perf.participantCount === 1 ? "" : "s"}
            .
          </p>
        ) : null}

        {perf.state === "ready" ? (
          <div class="[ stack ]">
            <PerformanceBlock
              title="Points"
              headingId="home-performance-points-heading"
              rank={perf.data.points.rank}
              totalParticipants={perf.data.total_participants}
            >
              <PerformanceMetricRow label="[ Net ]" value={perf.data.points.net} />
              <PerformanceMetricRow label="[ Rewards ]" value={perf.data.points.rewards} />
              <PerformanceMetricRow label="[ Penalties ]" value={perf.data.points.penalties} />
            </PerformanceBlock>
            <HorizontalDivider />
            <PerformanceBlock
              title="Predictions"
              headingId="home-performance-predictions-heading"
              rank={perf.data.predictions.rank}
              totalParticipants={perf.data.total_participants}
            >
              <PerformanceMetricRow
                label="[ Successful ]"
                value={perf.data.predictions.successful}
              />
              <PerformanceMetricRow label="[ Failed ]" value={perf.data.predictions.failed} />
              <PerformanceMetricRow label="[ Open ]" value={perf.data.predictions.open} />
              <PerformanceMetricRow label="[ Closed ]" value={perf.data.predictions.closed} />
              <PerformanceMetricRow label="[ Checking ]" value={perf.data.predictions.checking} />
              <PerformanceMetricRow label="[ Retired ]" value={perf.data.predictions.retired} />
            </PerformanceBlock>
            <HorizontalDivider />
            <PerformanceBlock
              title="Bets"
              headingId="home-performance-bets-heading"
              rank={perf.data.bets.rank}
              totalParticipants={perf.data.total_participants}
            >
              <PerformanceMetricRow label="[ Successful ]" value={perf.data.bets.successful} />
              <PerformanceMetricRow label="[ Failed ]" value={perf.data.bets.failed} />
              <PerformanceMetricRow label="[ Pending ]" value={perf.data.bets.pending} />
              <PerformanceMetricRow label="[ Retired ]" value={perf.data.bets.retired} />
              <PerformanceMetricRow label="[ Invalid ]" value={perf.data.bets.invalid} />
            </PerformanceBlock>
          </div>
        ) : null}
      </div>
    </CardScreenElement>
  );
}
