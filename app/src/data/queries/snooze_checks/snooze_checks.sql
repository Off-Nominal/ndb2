/* @name getSnoozeChecksByPredictionId */
SELECT
  sc.id,
  sc.prediction_id,
  sc.check_date,
  sc.closed,
  sc.closed_at,
  COUNT(sv.*) FILTER (WHERE sv.value = 1) as "votes_day!",
  COUNT(sv.*) FILTER (WHERE sv.value = 7) as "votes_week!",
  COUNT(sv.*) FILTER (WHERE sv.value = 30) as "votes_month!",
  COUNT(sv.*) FILTER (WHERE sv.value = 90) as "votes_quarter!",
  COUNT(sv.*) FILTER (WHERE sv.value = 365) as "votes_year!"
FROM snooze_checks sc
LEFT JOIN snooze_votes sv ON sv.snooze_check_id = sc.id
WHERE sc.prediction_id = :prediction_id!
GROUP BY sc.id
ORDER BY sc.check_date DESC;

/* @name closeSnoozeChecksByPredictionId */
UPDATE snooze_checks
  SET closed = true,
      closed_at = NOW()
  WHERE prediction_id = :prediction_id!;

/* @name closeSnoozeCheckById */
UPDATE snooze_checks
  SET closed = true, closed_at = NOW()
  WHERE id = :snooze_check_id!
  RETURNING id, prediction_id, check_date, closed, closed_at;

/* @name insertSnoozeCheck */
INSERT INTO snooze_checks (
  prediction_id
) VALUES (
  :prediction_id!
) RETURNING id, prediction_id, check_date, closed, closed_at;

/* @name getNextUnactionedSnoozeCheck */
SELECT
  id,
  prediction_id
FROM snooze_checks
WHERE closed IS false
  AND check_date <= NOW() - INTERVAL '1 day'
ORDER BY check_date
LIMIT 1;