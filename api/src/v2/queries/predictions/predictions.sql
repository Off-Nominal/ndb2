/* @name getPredictionsById */
SELECT
    p.id,
    p.user_id as predictor_id,
    u.discord_id as predictor_discord_id,
    p.text,
    p.driver,
    p.season_id,
    p.season_applicable,
    p.created_date,
    p.due_date,
    p.check_date,
    p.last_check_date,
    p.closed_date,
    p.triggered_date,
    p.triggerer_id,
    t.discord_id as trigerer_discord_id,
    p.judged_date,
    p.retired_date,
    p.status,
    p.endorse_ratio as endorse,
    p.undorse_ratio as undorse
  FROM predictions p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN users t ON t.id = p.triggerer_id
  WHERE p.id = :prediction_id!;

/* @name untriggerPredictionById */
UPDATE predictions SET 
  triggerer_id = NULL,
  triggered_date = NULL,
  closed_date = NULL
WHERE id = :prediction_id!;

/* @name unjudgePredictionById */
WITH deleted_votes AS (
  DELETE FROM votes WHERE prediction_id = :prediction_id!
)
UPDATE predictions
SET
  judged_date = NULL,
  closed_date = NULL,
  triggered_date = NULL,
  triggerer_id = NULL
WHERE id = :prediction_id!;

/* @name retirePredictionById */
UPDATE predictions 
  SET retired_date = NOW() 
  WHERE predictions.id = :prediction_id!;

/* @name insertEventDrivenPrediction */
INSERT INTO predictions (
  user_id,
  text,
  created_date,
  driver,
  check_date
) VALUES (
  :user_id!,
  :text!,
  :created_date!,
  'event',
  :check_date!
) RETURNING id;

/* @name insertDateDrivenPrediction */
INSERT INTO predictions (
  user_id,
  text,
  created_date,
  driver,
  due_date
) VALUES (
  :user_id!,
  :text!,
  :created_date!,
  'date',
  :due_date!
) RETURNING id;

/*
  searchPredictions — dynamic search (PgTyped: https://pgtyped.dev/docs/dynamic-queries).

  Filters: optional params use "param IS NULL OR …" / empty-array checks. sort_by is a single
  nullable string (first sort key only) via CASE. due_date-asc/desc use COALESCE(due_date, check_date).

  Query-level tuning: single-row CTE `search_defaults` (word_sim_threshold, keyword_prefix_min_len,
  page_size). Change values there only; keep PREDICTION_SEARCH_PAGE_SIZE in predictions/index.ts
  equal to page_size. LIMIT uses `(SELECT page_size FROM search_defaults)` because Postgres rejects
  `LIMIT sd.page_size` (non-constant limit). plainto_tsquery('english', kw) uses kw as-is; prefix
  stem is alnum-sanitized.

  Keyword ranking: ORDER BY word_similarity(kw, p.text) only (no ts_rank_cd).
*/
/* @name searchPredictions */
WITH search_defaults AS (
  SELECT
    0.38::double precision AS word_sim_threshold,
    5::integer AS keyword_prefix_min_len,
    10::integer AS page_size
)
SELECT
  p.id,
  p.user_id AS predictor_id,
  pred_u.discord_id AS predictor_discord_id,
  p.text,
  p.driver,
  p.season_id,
  p.season_applicable,
  p.created_date,
  p.due_date,
  p.check_date,
  p.last_check_date,
  p.closed_date,
  p.triggered_date,
  p.triggerer_id,
  trig_u.discord_id AS triggerer_discord_id,
  p.judged_date,
  p.retired_date,
  p.status,
  bet_totals.bets_endorsements,
  bet_totals.bets_undorsements,
  bet_totals.bets_invalid,
  vote_totals.votes_yes,
  vote_totals.votes_no,
  p.endorse_ratio AS endorse,
  p.undorse_ratio AS undorse
FROM search_defaults sd
CROSS JOIN predictions p
JOIN users pred_u ON pred_u.id = p.user_id
LEFT JOIN users trig_u ON trig_u.id = p.triggerer_id
CROSS JOIN LATERAL (
  SELECT
    t.kw,
    CASE
      WHEN t.kw IS NULL OR char_length(t.kw) < sd.keyword_prefix_min_len OR t.kw ~ '\s' THEN NULL
      ELSE NULLIF(
        regexp_replace(
          lower(left(t.kw, char_length(t.kw) - 1)),
          '[^a-z0-9]+',
          '',
          'g'
        ),
        ''
      )
    END AS prefix_stem
  FROM (SELECT NULLIF(trim(:keyword::text), '') AS kw) AS t
) AS k
CROSS JOIN LATERAL (
  SELECT
    COUNT(b.id) FILTER (WHERE b.endorsed IS TRUE AND b.valid IS TRUE) AS bets_endorsements,
    COUNT(b.id) FILTER (WHERE b.endorsed IS FALSE AND b.valid IS TRUE) AS bets_undorsements,
    COUNT(b.id) FILTER (WHERE b.valid IS FALSE) AS bets_invalid
  FROM bets b
  WHERE b.prediction_id = p.id
) AS bet_totals
CROSS JOIN LATERAL (
  SELECT
    COUNT(v.id) FILTER (WHERE v.vote IS TRUE) AS votes_yes,
    COUNT(v.id) FILTER (WHERE v.vote IS FALSE) AS votes_no
  FROM votes v
  WHERE v.prediction_id = p.id
) AS vote_totals
WHERE (
  COALESCE(cardinality(:statuses::text[]), 0) = 0
  OR p.status::text = ANY(:statuses)
)
AND (
  :predictor_id::uuid IS NULL
  OR p.user_id = :predictor_id
)
AND (
  :non_better_id::uuid IS NULL
  OR NOT EXISTS (
    SELECT 1 FROM bets b
    WHERE b.prediction_id = p.id AND b.user_id = :non_better_id
  )
)
AND (
  :season_id::integer IS NULL
  OR (
    p.season_id = :season_id
    AND (
      :include_non_applicable
      OR p.season_applicable IS TRUE
    )
  )
)
AND (
  :keyword::text IS NULL
  OR k.kw IS NULL
  OR p.search_vector @@ plainto_tsquery('english', k.kw)
  OR similarity(p.text, k.kw) >= sd.word_sim_threshold
  OR word_similarity(k.kw, p.text) >= sd.word_sim_threshold
  OR (
    k.prefix_stem IS NOT NULL
    AND p.search_vector @@ to_tsquery('english', k.prefix_stem || ':*')
  )
)
ORDER BY
  (CASE WHEN k.kw IS NULL THEN NULL ELSE word_similarity(k.kw, p.text) END) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'created_date-asc' THEN p.created_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'created_date-desc' THEN p.created_date END ) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'due_date-asc' THEN COALESCE(p.due_date, p.check_date) END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'due_date-desc' THEN COALESCE(p.due_date, p.check_date) END ) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'check_date-asc' THEN p.check_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'check_date-desc' THEN p.check_date END ) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'retired_date-asc' THEN p.retired_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'retired_date-desc' THEN p.retired_date END ) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'triggered_date-asc' THEN p.triggered_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'triggered_date-desc' THEN p.triggered_date END ) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'closed_date-asc' THEN p.closed_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'closed_date-desc' THEN p.closed_date END ) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'judged_date-asc' THEN p.judged_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'judged_date-desc' THEN p.judged_date END ) DESC NULLS LAST,
  p.id ASC
LIMIT (SELECT page_size FROM search_defaults)
OFFSET :row_offset!;
