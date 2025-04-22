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