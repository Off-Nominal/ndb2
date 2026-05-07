import type { Children } from "@kitajs/html";
import { DiscordAvatar } from "@web/shared/components/discord-avatar";
import { CardScreenElement } from "@web/shared/components/card-screen-element";
import { Table, Th, ThSortButton } from "@web/shared/components/table";
import { formatNumber } from "@web/shared/utils/format_number";
import {
  homeLeaderboardFragmentUrl,
  homeLeaderboardPageUrl,
  homeLeaderboardPlayerIdentityUrl,
  type HomeLeaderboardSortBy,
} from "../../leaderboard-sort.js";
import { formatRank, predictionOpenPipeline } from "./helpers";
import { mergeClass } from "@web/shared/utils/merge_class.js";

export interface HomePageLeaderboardMeta {
  page: number;
  per_page: number;
  total_count: number;
}

/** Mirrors API leaderboard breakdowns; decoupled from `@offnominal/ndb2-api-types` in markup. */
export interface HomePageLeaderboardPredictions {
  successful: number;
  failed: number;
  open: number;
  closed: number;
  checking: number;
  rank: number | null;
}

export interface HomePageLeaderboardBets {
  successful: number;
  failed: number;
  pending: number;
  retired: number;
  invalid: number;
  rank: number | null;
}

export interface HomePageLeaderboardPoints {
  rewards: number;
  penalties: number;
  net: number;
  rank: number | null;
}

export interface HomePageLeaderboardRow {
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  /** When true, guild-only batch resolution missed; identity is hydrated via HTMX fragment. */
  needsDeferredProfile: boolean;
  predictions: HomePageLeaderboardPredictions;
  bets: HomePageLeaderboardBets;
  points: HomePageLeaderboardPoints;
}

/** Leaderboard slice for the current season (net points, first page). */
export interface HomePageLeaderboard {
  meta: HomePageLeaderboardMeta;
  rows: HomePageLeaderboardRow[];
}

export type { HomeLeaderboardSortBy } from "../../leaderboard-sort.js";

export type LeaderboardTableProps = {
  leaderboard: HomePageLeaderboard;
  sortBy: HomeLeaderboardSortBy;
};

/**
 * Avatar + display name chip for leaderboard rows or HTMX identity fragments (`hydrateUrl` omitted).
 *
 * When **`hydrateUrl`** is set, HTMX swaps this element with the resolved markup after **`revealed`**
 * (+ throttle + **`once`**).
 */
export function LeaderboardPlayerChip(props: {
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  /** When set (non-empty), adds HTMX attributes to hydrate via `GET /home/leaderboard/player-identity`. */
  hydrateUrl?: string;
}): JSX.Element {
  const inner = (
    <>
      <DiscordAvatar url={props.avatarUrl} discordUserId={props.discordId} />
      <span class="[ leaderboard-player-name ]">{props.displayName}</span>
    </>
  );

  if (props.hydrateUrl != null && props.hydrateUrl !== "") {
    return (
      <span
        class="[ leaderboard-player ]"
        hx-get={props.hydrateUrl}
        hx-trigger="revealed throttle:250ms once"
        hx-swap="outerHTML"
      >
        {inner}
      </span>
    );
  }

  return <span class="[ leaderboard-player ]">{inner}</span>;
}

/** Home leaderboard wiring for {@link Th} (HTMX targets, sort labels). */
function LeaderboardSortTh(props: {
  class?: string;
  label: string;
  asc: HomeLeaderboardSortBy;
  desc: HomeLeaderboardSortBy;
  sortBy: HomeLeaderboardSortBy;
  sortMode: "rank" | "value";
  /** Short phrase for ARIA, e.g. “net points” or “successful bets”. */
  metricLabel: string;
}): JSX.Element {
  const groupLabel =
    props.sortMode === "rank"
      ? `Sort by ${props.metricLabel} rank`
      : `Sort by ${props.metricLabel}`;
  const ascLabel =
    props.sortMode === "rank"
      ? `Higher ${props.metricLabel} rank number first`
      : `Lowest ${props.metricLabel} first`;
  const descLabel =
    props.sortMode === "rank"
      ? `Best ${props.metricLabel} rank first`
      : `Highest ${props.metricLabel} first`;

  return (
    <Th label={props.label} sortGroupAriaLabel={groupLabel} class={mergeClass("[ table-cell--align-end ]", props.class)}>
      <ThSortButton
        direction="asc"
        hx-get={homeLeaderboardFragmentUrl(props.asc)}
        hx-target="#leaderboard-root"
        hx-swap="outerHTML"
        hx-push-url={homeLeaderboardPageUrl(props.asc)}
        aria-label={ascLabel}
        aria-pressed={props.sortBy === props.asc ? "true" : "false"}
      />
      <ThSortButton
        direction="desc"
        hx-get={homeLeaderboardFragmentUrl(props.desc)}
        hx-target="#leaderboard-root"
        hx-swap="outerHTML"
        hx-push-url={homeLeaderboardPageUrl(props.desc)}
        aria-label={descLabel}
        aria-pressed={props.sortBy === props.desc ? "true" : "false"}
      />
    </Th>
  );
}

function LeaderboardRoot(props: { children: JSX.Element }): JSX.Element {
  return (
    <div id="leaderboard-root" class="[ leaderboard-table-root ]">
      {props.children}
    </div>
  );
}

/** Leaderboard headline + HUD card body for non-tabular empty states (no `<table>` — column count is breakpoint-dependent). */
function LeaderboardMessageCard(props: { message: string }): JSX.Element {
  return (
    <CardScreenElement heading="Leaderboard" headingElement="h2">
      <p class="[ leaderboard-empty ]">{props.message}</p>
    </CardScreenElement>
  );
}

/** Leaderboard headline + HUD card; {@link Table} is the direct child of the card body. */
function LeaderboardTableInCard(props: { ariaLabel: string; children: Children }): JSX.Element {
  return (
    <CardScreenElement heading="Leaderboard" headingElement="h2">
      <Table aria-label={props.ariaLabel}>{props.children}</Table>
    </CardScreenElement>
  );
}

function LeaderboardTableThead(props: {
  sortBy: HomeLeaderboardSortBy;
}): JSX.Element {
  return (
    <thead>
      <tr>
        <th rowspan={2} scope="col">
          Player
        </th>
        <th colspan={2} scope="colgroup" class="[ hide-desktop-up ]">
          Points
        </th>
        <th colspan={4} scope="colgroup" class="[ show-desktop-up ]">
          Points
        </th>
        <th colspan={2} scope="colgroup" class="[ show-mobile-up hide-desktop-up ]">
          Predictions
        </th>
        <th colspan={4} scope="colgroup" class="[ show-desktop-up ]">
          Predictions
        </th>
        <th colspan={2} scope="colgroup" class="[ show-tablet-up hide-desktop-up ]">
          Bets
        </th>
        <th colspan={4} scope="colgroup" class="[ show-desktop-up ]">
          Bets
        </th>
      </tr>
      <tr>
        {/* Points */}
        <LeaderboardSortTh
          label="Rank"
          asc="rank_points_net-asc"
          desc="rank_points_net-desc"
          sortBy={props.sortBy}
          sortMode="rank"
          metricLabel="net points"
        />
        <LeaderboardSortTh
          label="Net"
          asc="points_net-asc"
          desc="points_net-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="net points"
        />
        <LeaderboardSortTh
          label="Gain"
          asc="points_rewards-asc"
          desc="points_rewards-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="point rewards"
          class="[ show-desktop-up ]"
        />
        <LeaderboardSortTh
          label="Loss"
          asc="points_penalties-asc"
          desc="points_penalties-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="point penalties"
          class="[ show-desktop-up ]"
        />
        {/* Predictions */}
        <LeaderboardSortTh
          label="Rank"
          asc="rank_predictions_successful-asc"
          desc="rank_predictions_successful-desc"
          sortBy={props.sortBy}
          sortMode="rank"
          metricLabel="successful predictions"
          class="[ show-mobile-up ]"
        />
        <LeaderboardSortTh
          label="Won"
          asc="predictions_successful-asc"
          desc="predictions_successful-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="successful predictions"
          class="[ show-mobile-up ]"
        />
        <LeaderboardSortTh
          label="Lost"
          asc="predictions_failed-asc"
          desc="predictions_failed-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="failed predictions"
          class="[ show-desktop-up ]"
        />
        <LeaderboardSortTh
          label="Open"
          asc="predictions_open-asc"
          desc="predictions_open-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="predictions in open status"
          class="[ show-desktop-up ]"
        />
        {/* Bets */}
        <LeaderboardSortTh
          label="Rank"
          asc="rank_bets_successful-asc"
          desc="rank_bets_successful-desc"
          sortBy={props.sortBy}
          sortMode="rank"
          metricLabel="successful bets"
          class="[ show-tablet-up ]"
        />
        <LeaderboardSortTh
          label="Won"
          asc="bets_successful-asc"
          desc="bets_successful-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="successful bets"
          class="[ show-tablet-up ]"
        />
        <LeaderboardSortTh
          label="Lost"
          asc="bets_failed-asc"
          desc="bets_failed-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="failed bets"
          class="[ show-desktop-up ]"
        />
        <LeaderboardSortTh
          label="Open"
          asc="bets_pending-asc"
          desc="bets_pending-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="pending bets"
          class="[ show-desktop-up ]"
        />
      </tr>
    </thead>
  );
}

/** Current-season leaderboard; column sort uses HTMX swap on `#leaderboard-root`; empty states use card + message. */
export function LeaderboardTable(props: LeaderboardTableProps): JSX.Element {
  if (props.leaderboard.rows.length === 0) {
    return (
      <LeaderboardRoot>
        <LeaderboardMessageCard message="No participants in the current season yet." />
      </LeaderboardRoot>
    );
  }

  return (
    <LeaderboardRoot>
      <LeaderboardTableInCard ariaLabel="Current season leaderboard">
        <LeaderboardTableThead sortBy={props.sortBy} />
        <tbody>
          {props.leaderboard.rows.map((row) => (
            <tr>
              <td class="[ table-cell--align-start ]">
                <LeaderboardPlayerChip
                  discordId={row.discordId}
                  displayName={row.displayName}
                  avatarUrl={row.avatarUrl}
                  hydrateUrl={
                    row.needsDeferredProfile
                      ? homeLeaderboardPlayerIdentityUrl(row.discordId)
                      : undefined
                  }
                />
              </td>
              <td class="[ table-cell--align-end ]">{formatRank(row.points.rank)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.points.net)}</td>
              <td class="[ show-desktop-up ][ table-cell--align-end ]">{formatNumber(row.points.rewards)}</td>
              <td class="[ show-desktop-up ][ table-cell--align-end ]">{formatNumber(row.points.penalties)}</td>
              <td class="[ show-mobile-up ][ table-cell--align-end ]">{formatRank(row.predictions.rank)}</td>
              <td class="[ show-mobile-up ][ table-cell--align-end ]">{formatNumber(row.predictions.successful)}</td>
              <td class="[ show-desktop-up ][ table-cell--align-end ]">{formatNumber(row.predictions.failed)}</td>
              <td class="[ show-desktop-up ][ table-cell--align-end ]">{formatNumber(predictionOpenPipeline(row.predictions))}</td>
              <td class="[ show-tablet-up ][ table-cell--align-end ]">{formatRank(row.bets.rank)}</td>
              <td class="[ show-tablet-up ][ table-cell--align-end ]">{formatNumber(row.bets.successful)}</td>
              <td class="[ show-desktop-up ][ table-cell--align-end ]">{formatNumber(row.bets.failed)}</td>
              <td class="[ show-desktop-up ][ table-cell--align-end ]">{formatNumber(row.bets.pending)}</td>
            </tr>
          ))}
        </tbody>
      </LeaderboardTableInCard>
    </LeaderboardRoot>
  );
}
