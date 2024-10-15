  SELECT 
    id, 
    prediction_id, 
    check_date, 
    closed, 
    closed_at,
    (SELECT row_to_json(vals)
      FROM(
        SELECT
          COUNT(sv.*) FILTER (WHERE sv.value = 1) as day,
          COUNT(sv.*) FILTER (WHERE sv.value = 7) as week,
          COUNT(sv.*) FILTER (WHERE sv.value = 30) as month,
          COUNT(sv.*) FILTER (WHERE sv.value = 90) as quarter,
          COUNT(sv.*) FILTER (WHERE sv.value = 365) as year
        FROM snooze_votes sv
        WHERE sv.snooze_check_id = $1
      ) vals
    ) as votes
  FROM snooze_checks
  WHERE id = $1