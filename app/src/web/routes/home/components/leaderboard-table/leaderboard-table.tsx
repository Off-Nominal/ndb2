import type { Children } from "@kitajs/html";
import { CardScreenElement } from "@web/shared/components/card-screen-element";
import { Table, Th } from "@web/shared/components/table";
import {
  homeLeaderboardFragmentUrl,
  homeLeaderboardPageUrl,
  type HomeLeaderboardSortBy,
} from "../../leaderboard-sort.js";

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
  /**
   * Leaderboard rows from the DB, or `null` when there is no current season.
   * **`undefined`**: season exists but data is loaded asynchronously (see `hx-trigger="load"` shell).
   */
  leaderboard: HomePageLeaderboard | null | undefined;
  sortBy: HomeLeaderboardSortBy;
};

const EMPTY_COLSPAN = 13;

/** Shared {@link Table} column alignment (logical start/end). */
const CELL_ALIGN_START = "[ table-cell--align-start ]";
const CELL_ALIGN_END = "[ table-cell--align-end ]";

/** Home leaderboard wiring for {@link Th} (HTMX targets, sort labels). */
function LeaderboardSortTh(props: {
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
      ascending={{
        "hx-get": homeLeaderboardFragmentUrl(props.asc),
        "hx-target": "#leaderboard-root",
        "hx-swap": "outerHTML",
        "hx-push-url": homeLeaderboardPageUrl(props.asc),
        "aria-label": ascLabel,
        "aria-pressed": props.sortBy === props.asc ? "true" : "false",
      }}
      descending={{
        "hx-get": homeLeaderboardFragmentUrl(props.desc),
        "hx-target": "#leaderboard-root",
        "hx-swap": "outerHTML",
        "hx-push-url": homeLeaderboardPageUrl(props.desc),
        "aria-label": descLabel,
        "aria-pressed": props.sortBy === props.desc ? "true" : "false",
      }}
    />
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

function formatRank(value: number | null): string {
  return value != null ? String(value) : "—";
}

/** Unresolved prediction pipeline: open + closed + checking. */
function predictionOpenPipeline(p: HomePageLeaderboardPredictions): number {
  return p.open + p.closed + p.checking;
}

function LeaderboardRoot(props: { children: JSX.Element }): JSX.Element {
  return (
    <div id="leaderboard-root" class="[ leaderboard-table-root ]">
      {props.children}
    </div>
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
        <th colspan={4} scope="colgroup">
          Points
        </th>
        <th colspan={4} scope="colgroup">
          Predictions
        </th>
        <th colspan={4} scope="colgroup">
          Bets
        </th>
      </tr>
      <tr>
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
          label="Rewards"
          asc="points_rewards-asc"
          desc="points_rewards-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="point rewards"
        />
        <LeaderboardSortTh
          label="Penalties"
          asc="points_penalties-asc"
          desc="points_penalties-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="point penalties"
        />
        <LeaderboardSortTh
          label="Rank"
          asc="rank_predictions_successful-asc"
          desc="rank_predictions_successful-desc"
          sortBy={props.sortBy}
          sortMode="rank"
          metricLabel="successful predictions"
        />
        <LeaderboardSortTh
          label="Succ"
          asc="predictions_successful-asc"
          desc="predictions_successful-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="successful predictions"
        />
        <LeaderboardSortTh
          label="Fail"
          asc="predictions_failed-asc"
          desc="predictions_failed-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="failed predictions"
        />
        {/*
          Cell = open + closed + checking; sort uses `predictions_open` only (no combined API key).
        */}
        <LeaderboardSortTh
          label="Open"
          asc="predictions_open-asc"
          desc="predictions_open-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="predictions in open status"
        />
        <LeaderboardSortTh
          label="Rank"
          asc="rank_bets_successful-asc"
          desc="rank_bets_successful-desc"
          sortBy={props.sortBy}
          sortMode="rank"
          metricLabel="successful bets"
        />
        <LeaderboardSortTh
          label="Succ"
          asc="bets_successful-asc"
          desc="bets_successful-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="successful bets"
        />
        <LeaderboardSortTh
          label="Fail"
          asc="bets_failed-asc"
          desc="bets_failed-desc"
          sortBy={props.sortBy}
          sortMode="value"
          metricLabel="failed bets"
        />
        <LeaderboardSortTh
          label="Pend"
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

/** Current-season leaderboard; {@link CardScreenElement} + {@link Table}. */
export function LeaderboardTable(props: LeaderboardTableProps): JSX.Element {
  /* HTMX swaps only after the full response; defer fetch so `/` isn’t blocked on DB + Discord. */
  if (props.leaderboard === undefined) {
    return (
      <div
        id="leaderboard-root"
        class="[ leaderboard-table-root ]"
        hx-get={homeLeaderboardFragmentUrl(props.sortBy)}
        hx-trigger="load"
        hx-swap="outerHTML"
      >
        <div class="[ leaderboard-pending ]" aria-busy="true" aria-live="polite">
          <span class="[ leaderboard-pending__text ]">Loading leaderboard…</span>
        </div>
      </div>
    );
  }

  if (props.leaderboard == null) {
    return (
      <LeaderboardRoot>
        <LeaderboardTableInCard ariaLabel="Leaderboard">
          <tbody>
            <tr>
              <td colspan={EMPTY_COLSPAN}>
                No current season is available; leaderboard is unavailable.
              </td>
            </tr>
          </tbody>
        </LeaderboardTableInCard>
      </LeaderboardRoot>
    );
  }

  if (props.leaderboard.rows.length === 0) {
    return (
      <LeaderboardRoot>
        <LeaderboardTableInCard ariaLabel="Current season leaderboard">
          <LeaderboardTableThead sortBy={props.sortBy} />
          <tbody>
            <tr>
              <td colspan={EMPTY_COLSPAN}>No participants in the current season yet.</td>
            </tr>
          </tbody>
        </LeaderboardTableInCard>
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
              <td class={CELL_ALIGN_START}>
                <span class="[ leaderboard-player ]">
                  {row.avatarUrl != null ? (
                    <img
                      src={row.avatarUrl}
                      alt=""
                      width={20}
                      height={20}
                      loading="lazy"
                    />
                  ) : (
                    <span class="[ leaderboard-player-fallback ]" aria-hidden="true">
                      {row.displayName.trim().slice(0, 1).toUpperCase() || "?"}
                    </span>
                  )}
                  <span>{row.displayName}</span>
                </span>
              </td>
              <td class={CELL_ALIGN_START}>{formatRank(row.points.rank)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.points.net)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.points.rewards)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.points.penalties)}</td>
              <td class={CELL_ALIGN_START}>{formatRank(row.predictions.rank)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.predictions.successful)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.predictions.failed)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(predictionOpenPipeline(row.predictions))}</td>
              <td class={CELL_ALIGN_START}>{formatRank(row.bets.rank)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.bets.successful)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.bets.failed)}</td>
              <td class={CELL_ALIGN_END}>{formatNumber(row.bets.pending)}</td>
            </tr>
          ))}
        </tbody>
      </LeaderboardTableInCard>
    </LeaderboardRoot>
  );
}
