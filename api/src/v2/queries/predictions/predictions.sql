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
  Dynamic search: optional filters use "param IS NULL OR …" / empty-array checks
  (see https://pgtyped.dev/docs/dynamic-queries). Single nullable sort_by string
  (first sort only) via CASE expressions; keyword uses optional pg_trgm distance;
  row_offset is (page - 1) * 10 from the API layer.
*/
/* @name searchPredictions */
SELECT
  p.id,
  (SELECT row_to_json(pred) FROM
      (SELECT
          p.user_id as id,
          u.discord_id
        FROM users u
        WHERE u.id = p.user_id)
    pred)
  as predictor,
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
  (SELECT row_to_json(trig) FROM
      (SELECT
          p.triggerer_id as id,
          u.discord_id
        FROM users u
        WHERE u.id = p.triggerer_id)
    trig)
  as triggerer,
  p.judged_date,
  p.retired_date,
  p.status,
  (SELECT row_to_json(bs) FROM
      (SELECT
        COUNT(b.id) FILTER (WHERE b.endorsed IS TRUE AND b.valid IS TRUE) as endorsements,
        COUNT(b.id) FILTER (WHERE b.endorsed IS FALSE AND b.valid IS TRUE) as undorsements,
        COUNT(b.id) FILTER (WHERE b.valid IS FALSE) as invalid
        FROM bets b
        WHERE b.prediction_id = p.id
      ) bs
  ) as bets,
  (SELECT row_to_json(vs) FROM
      (SELECT
        COUNT(v.id) FILTER (WHERE v.vote IS TRUE) as yes,
        COUNT(v.id) FILTER (WHERE v.vote IS FALSE) as no
        FROM votes v
        WHERE v.prediction_id = p.id
      ) vs
  ) as votes,
  (SELECT row_to_json(payout_sum)
    FROM(
      SELECT p.endorse_ratio as endorse, p.undorse_ratio as undorse
    ) payout_sum
  ) as payouts
FROM predictions p
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
ORDER BY
  (CASE WHEN :keyword::text IS NULL THEN NULL ELSE (p.text <-> :keyword::text) END) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'created_date-asc' THEN p.created_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'created_date-desc' THEN p.created_date END ) DESC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'due_date-asc' THEN p.due_date END ) ASC NULLS LAST,
  ( CASE WHEN :sort_by::text = 'due_date-desc' THEN p.due_date END ) DESC NULLS LAST,
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
LIMIT 10
OFFSET :row_offset!;
