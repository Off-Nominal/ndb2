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
JOIN snooze_votes sv ON sv.snooze_check_id = sc.id
WHERE sc.prediction_id = :prediction_id!
GROUP BY sc.id
ORDER BY sc.check_date DESC;