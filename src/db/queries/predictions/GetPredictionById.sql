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
    (SELECT 
      COALESCE(jsonb_agg(p_bets), '[]') 
      FROM
        (SELECT 
          b.id, 
          (SELECT row_to_json(bett) FROM 
            (SELECT 
                u.id, 
                u.discord_id
              FROM users u 
              WHERE u.id = b.user_id) 
            bett) 
          as better, 
          b.date,
          b.endorsed,
          b.wager,
          b.valid,
          b.payout,
          b.season_payout
          FROM bets b
          WHERE b.prediction_id = p.id
          ORDER BY date ASC
        ) p_bets 
  ) as bets,
  (SELECT 
    COALESCE(jsonb_agg(p_votes), '[]') 
    FROM
      (SELECT 
          id, 
          (SELECT row_to_json(vott) FROM 
            (SELECT 
                u.id, 
                u.discord_id
              FROM users u 
              WHERE u.id = v.user_id) 
            vott) 
          as voter, 
          voted_date,
          vote
        FROM votes v
        WHERE v.prediction_id = p.id
        ORDER BY voted_date DESC
      ) p_votes
  ) as votes,
  (SELECT
    COALESCE(jsonb_agg(p_snooze_checks), '[]')
    FROM
      (SELECT
          sc.id,
          sc.check_date,
          sc.closed,
          sc.closed_at,
          (SELECT row_to_json(vals)
            FROM(
              SELECT
                COUNT(sv.*) FILTER (WHERE sv.value = 0) as trigger,
                COUNT(sv.*) FILTER (WHERE sv.value = 1) as day,
                COUNT(sv.*) FILTER (WHERE sv.value = 7) as week,
                COUNT(sv.*) FILTER (WHERE sv.value = 30) as month,
                COUNT(sv.*) FILTER (WHERE sv.value = 90) as quarter,
                COUNT(sv.*) FILTER (WHERE sv.value = 365) as year
              FROM snooze_votes sv
              WHERE sv.snooze_check_id = sc.id
            ) vals
          ) as values
        FROM snooze_checks sc
        WHERE sc.prediction_id = p.id
        ORDER BY sc.check_date DESC
      ) p_snooze_checks
  ) as checks,
  (SELECT row_to_json(payout_sum)
    FROM(
      SELECT p.endorse_ratio as endorse, p.undorse_ratio as undorse
    ) payout_sum
  ) as payouts
  FROM predictions p
  WHERE p.id = $1