/* @name insertSnoozeVote */
INSERT INTO snooze_votes (
  snooze_check_id,
  user_id,
  value,
  created_at
) VALUES (
  :snooze_check_id!,
  :user_id!,
  :value!,
  :created_at!
)
ON CONFLICT (snooze_check_id, user_id)
  DO UPDATE SET value = :value!, created_at = :created_at!
RETURNING snooze_check_id, user_id, value, created_at;

/* @name getSnoozeCheckVoteTallies */
SELECT
  sc.id,
  sc.prediction_id,
  sc.check_date,
  sc.closed,
  sc.closed_at,
  (SELECT row_to_json(vals)
    FROM (
      SELECT
        COUNT(sv.*) FILTER (WHERE sv.value = 1) AS day,
        COUNT(sv.*) FILTER (WHERE sv.value = 7) AS week,
        COUNT(sv.*) FILTER (WHERE sv.value = 30) AS month,
        COUNT(sv.*) FILTER (WHERE sv.value = 90) AS quarter,
        COUNT(sv.*) FILTER (WHERE sv.value = 365) AS year
      FROM snooze_votes sv
      WHERE sv.snooze_check_id = sc.id
    ) vals
  ) AS values
FROM snooze_checks sc
WHERE sc.id = :snooze_check_id!;
