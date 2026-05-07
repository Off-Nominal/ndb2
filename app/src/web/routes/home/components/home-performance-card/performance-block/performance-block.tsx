import type { Children } from "@kitajs/html";
import { formatNumber } from "@web/shared/utils/format_number";
import { formatRank } from "../../leaderboard-table/helpers";

export type PerformanceBlockProps = {
  title: string;
  headingId: string;
  rank: number | null;
  totalParticipants: number;
  children: Children;
};

/** Rank summary + metric rows; summary inline-start and metrics inline-end at every viewport width. */
export function PerformanceBlock(props: PerformanceBlockProps): JSX.Element {
  const rankStr = formatRank(props.rank);

  return (
    <section class="[ performance-block ]" aria-labelledby={props.headingId}>
      <div class="[ stack ] [ performance-block__summary ]">
        <h3 class={"[ overline ]"} id={props.headingId}>
          {props.title}
        </h3>
        <p class="[ performance-block__rank ]">{rankStr}<sup>th</sup></p>
        <p class="[ performance-block__rank-context ]">
          of {formatNumber(props.totalParticipants)} players
        </p>
      </div>
      <div class={"[ stack ] [ performance-block__body ] [ stripe-even-rows ]"}>{props.children}</div>
    </section>
  );
}
