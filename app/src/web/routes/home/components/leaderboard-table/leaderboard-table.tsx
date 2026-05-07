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

export function leaderboardPlayerAvatarCellId(discordId: string): string {
  return `leaderboard-player-av-${discordId}`;
}

export function leaderboardPlayerNameCellId(discordId: string): string {
  return `leaderboard-player-nm-${discordId}`;
}

/**
 * HTMX out-of-band swap pair for `GET /home/leaderboard/player-identity` (matches {@link LeaderboardPlayerRowCells} ids).
 */
export function LeaderboardPlayerIdentityOobCells(props: {
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
}): JSX.Element {
  return (
    <>
      <td
        id={leaderboardPlayerAvatarCellId(props.discordId)}
        hx-swap-oob="true"
        class="[ table-cell--align-start ] [ leaderboard-player-avatar-cell ]"
      >
        <DiscordAvatar url={props.avatarUrl} discordUserId={props.discordId} />
      </td>
      <td
        id={leaderboardPlayerNameCellId(props.discordId)}
        hx-swap-oob="true"
        class="[ table-cell--align-start ] [ leaderboard-player-name-cell ]"
      >
        <span class="[ leaderboard-player-name ]">{props.displayName}</span>
      </td>
    </>
  );
}

function LeaderboardPlayerRowCells(props: { row: HomePageLeaderboardRow }): JSX.Element {
  const { row } = props;
  const avatar = <DiscordAvatar url={row.avatarUrl} discordUserId={row.discordId} />;
  const name = <span class="[ leaderboard-player-name ]">{row.displayName}</span>;

  if (row.needsDeferredProfile) {
    const hydrateUrl = homeLeaderboardPlayerIdentityUrl(row.discordId);
    return (
      <>
        <td
          id={leaderboardPlayerAvatarCellId(row.discordId)}
          class="[ table-cell--align-start ] [ leaderboard-player-avatar-cell ]"
          hx-get={hydrateUrl}
          hx-trigger="revealed throttle:250ms once"
          hx-swap="none"
        >
          {avatar}
        </td>
        <td
          id={leaderboardPlayerNameCellId(row.discordId)}
          class="[ table-cell--align-start ] [ leaderboard-player-name-cell ]"
        >
          {name}
        </td>
      </>
    );
  }

  return (
    <>
      <td class="[ table-cell--align-start ] [ leaderboard-player-avatar-cell ]">{avatar}</td>
      <td class="[ table-cell--align-start ] [ leaderboard-player-name-cell ]">{name}</td>
    </>
  );
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
    <Th
      label={props.label}
      sortGroupAriaLabel={groupLabel}
      class={mergeClass("[ table-cell--align-end ]", props.class)}
    >
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

/** Leaderboard headline + HUD card; {@link Table} uses {@link CardScreenElement} `bodyOverflowX="auto"`. */
function LeaderboardTableInCard(props: { ariaLabel: string; children: Children }): JSX.Element {
  return (
    <CardScreenElement heading="Leaderboard" headingElement="h2" bodyOverflowX="auto">
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
        <th
          rowspan={2}
          scope="col"
          class="[ leaderboard-table-th--identity ] [ leaderboard-table-th--avatar ]"
        >
          <span class="[ visually-hidden ]">Avatar</span>
        </th>
        <th rowspan={2} scope="col" class="[ leaderboard-table-th--identity ]">
          <span class="[ visually-hidden ]">Display name</span>
        </th>
        <th colspan={4} scope="colgroup">
          Points
        </th>
        <th colspan={4} scope="colgroup" class="[ table-cell--column-divider ]">
          Predictions
        </th>
        <th colspan={4} scope="colgroup" class="[ table-cell--column-divider ]">
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
        />
        <LeaderboardSortTh
          label="Loss"
          asc="points_penalties-asc"
          desc="points_penalties-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="point penalties"
        />
        {/* Predictions */}
        <LeaderboardSortTh
          label="Rank"
          asc="rank_predictions_successful-asc"
          desc="rank_predictions_successful-desc"
          sortBy={props.sortBy}
          sortMode="rank"
          metricLabel="successful predictions"
          class="[ table-cell--column-divider ]"
        />
        <LeaderboardSortTh
          label="Won"
          asc="predictions_successful-asc"
          desc="predictions_successful-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="successful predictions"
        />
        <LeaderboardSortTh
          label="Lost"
          asc="predictions_failed-asc"
          desc="predictions_failed-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="failed predictions"
        />
        <LeaderboardSortTh
          label="Open"
          asc="predictions_open-asc"
          desc="predictions_open-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="predictions in open status"
        />
        {/* Bets */}
        <LeaderboardSortTh
          label="Rank"
          asc="rank_bets_successful-asc"
          desc="rank_bets_successful-desc"
          sortBy={props.sortBy}
          sortMode="rank"
          metricLabel="successful bets"
          class="[ table-cell--column-divider ]"
        />
        <LeaderboardSortTh
          label="Won"
          asc="bets_successful-asc"
          desc="bets_successful-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="successful bets"
        />
        <LeaderboardSortTh
          label="Lost"
          asc="bets_failed-asc"
          desc="bets_failed-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="failed bets"
        />
        <LeaderboardSortTh
          label="Open"
          asc="bets_pending-asc"
          desc="bets_pending-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="pending bets"
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
              <LeaderboardPlayerRowCells row={row} />
              <td class="[ table-cell--align-end ]">
                {formatRank(row.points.rank)}
              </td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.points.net)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.points.rewards)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.points.penalties)}</td>
              <td class="[ table-cell--align-end ] [ table-cell--column-divider ]">
                {formatRank(row.predictions.rank)}
              </td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.predictions.successful)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.predictions.failed)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(predictionOpenPipeline(row.predictions))}</td>
              <td class="[ table-cell--align-end ] [ table-cell--column-divider ]">{formatRank(row.bets.rank)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.bets.successful)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.bets.failed)}</td>
              <td class="[ table-cell--align-end ]">{formatNumber(row.bets.pending)}</td>
            </tr>
          ))}
        </tbody>
      </LeaderboardTableInCard>
    </LeaderboardRoot>
  );
}
