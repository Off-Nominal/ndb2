/* @name getAllSeasons */
SELECT
  id,
  name,
  start,
  "end",
  wager_cap,
  closed
FROM seasons
ORDER BY "end" DESC;

/* @name getSeasonById */
SELECT
  s.id,
  s.name,
  s.start,
  s."end",
  s.wager_cap,
  s.closed,
  COALESCE(pred_agg.successful, 0)::int AS predictions_successful,
  COALESCE(pred_agg.failed, 0)::int AS predictions_failed,
  COALESCE(pred_agg.retired, 0)::int AS predictions_retired,
  COALESCE(pred_agg.closed, 0)::int AS predictions_closed,
  COALESCE(pred_agg.checking, 0)::int AS predictions_checking,
  COALESCE(pred_agg.open, 0)::int AS predictions_open
FROM seasons AS s
LEFT JOIN (
  SELECT
    season_id,
    COUNT(*) FILTER (WHERE status = 'successful')::int AS successful,
    COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
    COUNT(*) FILTER (WHERE status = 'retired')::int AS retired,
    COUNT(*) FILTER (WHERE status = 'closed')::int AS closed,
    COUNT(*) FILTER (WHERE status = 'checking')::int AS checking,
    COUNT(*) FILTER (WHERE status = 'open')::int AS open
  FROM predictions
  GROUP BY season_id
) AS pred_agg ON pred_agg.season_id = s.id
WHERE s.id = :id!;

/* @name closeSeasonById */
UPDATE seasons
SET closed = TRUE
WHERE id = :id!
RETURNING id;

/* @name getSeasonResultsById */
WITH season AS (
  SELECT
    id,
    name,
    start,
    "end",
    wager_cap,
    closed
  FROM seasons
  WHERE id = :id!
),
prediction_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE closed_date IS NOT NULL)::int AS closed,
    COUNT(*) FILTER (WHERE status = 'successful')::int AS successes,
    COUNT(*) FILTER (WHERE status = 'failed')::int AS failures
  FROM predictions
  WHERE season_id = :id!
),
bet_stats AS (
  SELECT
    COUNT(bets.*) FILTER (WHERE predictions.closed_date IS NOT NULL)::int AS closed,
    COUNT(bets.*) FILTER (
      WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0
    )::int AS successes,
    COUNT(bets.*) FILTER (
      WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0
    )::int AS failures
  FROM bets
  JOIN predictions ON predictions.id = bets.prediction_id
  WHERE predictions.season_id = :id! AND bets.valid IS TRUE
),
score_stats AS (
  SELECT
    COALESCE(
      SUM(bets.season_payout) FILTER (
        WHERE bets.season_payout IS NOT NULL AND bets.season_payout > 0
      ),
      0
    ) AS payouts,
    COALESCE(
      SUM(bets.season_payout) FILTER (
        WHERE bets.season_payout IS NOT NULL AND bets.season_payout < 0
      ),
      0
    ) AS penalties
  FROM bets
  JOIN predictions ON predictions.id = bets.prediction_id
  WHERE predictions.season_id = :id! AND bets.valid IS TRUE
),
largest_payout AS (
  SELECT
    bets.season_payout AS value,
    predictions.id AS prediction_id,
    users.id AS better_id,
    users.discord_id AS better_discord_id
  FROM bets
  JOIN predictions ON predictions.id = bets.prediction_id
  JOIN users ON users.id = bets.user_id
  WHERE
    predictions.season_id = :id!
    AND bets.valid IS TRUE
    AND bets.season_payout IS NOT NULL
  ORDER BY bets.season_payout DESC
  LIMIT 1
),
largest_penalty AS (
  SELECT
    bets.season_payout AS value,
    predictions.id AS prediction_id,
    users.id AS better_id,
    users.discord_id AS better_discord_id
  FROM bets
  JOIN predictions ON predictions.id = bets.prediction_id
  JOIN users ON users.id = bets.user_id
  WHERE
    predictions.season_id = :id!
    AND bets.valid IS TRUE
    AND bets.season_payout IS NOT NULL
  ORDER BY bets.season_payout ASC
  LIMIT 1
)
SELECT
  season.id AS season_id,
  season.name AS season_name,
  season.start AS season_start,
  season."end" AS season_end,
  season.wager_cap AS season_wager_cap,
  season.closed AS season_closed,
  prediction_stats.closed AS predictions_closed,
  prediction_stats.successes AS predictions_successes,
  prediction_stats.failures AS predictions_failures,
  bet_stats.closed AS bets_closed,
  bet_stats.successes AS bets_successes,
  bet_stats.failures AS bets_failures,
  score_stats.payouts AS scores_payouts,
  score_stats.penalties AS scores_penalties,
  largest_payout.value AS largest_payout_value,
  CASE
    WHEN largest_payout.value IS NULL THEN NULL
    ELSE largest_payout.prediction_id
  END AS largest_payout_prediction_id,
  CASE
    WHEN largest_payout.value IS NULL THEN NULL
    ELSE largest_payout.better_id
  END AS largest_payout_better_id,
  CASE
    WHEN largest_payout.value IS NULL THEN NULL
    ELSE largest_payout.better_discord_id
  END AS largest_payout_better_discord_id,
  largest_penalty.value AS largest_penalty_value,
  CASE
    WHEN largest_penalty.value IS NULL THEN NULL
    ELSE largest_penalty.prediction_id
  END AS largest_penalty_prediction_id,
  CASE
    WHEN largest_penalty.value IS NULL THEN NULL
    ELSE largest_penalty.better_id
  END AS largest_penalty_better_id,
  CASE
    WHEN largest_penalty.value IS NULL THEN NULL
    ELSE largest_penalty.better_discord_id
  END AS largest_penalty_better_discord_id
FROM season
CROSS JOIN prediction_stats
CROSS JOIN bet_stats
CROSS JOIN score_stats
LEFT JOIN largest_payout ON TRUE
LEFT JOIN largest_penalty ON TRUE;