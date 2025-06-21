/* Replace with your SQL commands */

CREATE OR REPLACE VIEW enhanced_predictions AS
  WITH current_season_payout_formula AS (
    SELECT payout_formula
    FROM seasons
    WHERE NOW() >= seasons.start AND NOW() < seasons.end
    LIMIT 1
  )
  SELECT
    p.id as prediction_id,
    p.user_id as predictor_id,
    p.text,
    p.created_date,
    p.due_date,
    p.closed_date,
    p.judged_date,
    p.retired_date,
    p.triggered_date,
    p.triggerer_id,
    seasons.id as season_id,
    (CASE
      WHEN p.retired_date IS NOT NULL THEN 'retired'
      WHEN p.judged_date IS NOT NULL THEN
        CASE 
          WHEN 
            (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = p.id)
              THEN 'successful'
          ELSE 'failed'
        END
      WHEN p.closed_date IS NOT NULL THEN 'closed'
      ELSE 'open'
    END) as status,
    (SELECT COUNT(id) FILTER (WHERE b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as endorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS TRUE), 0
          ), 0
      )
    ) as total_endorsement_wagers,
    (SELECT COUNT(id) FILTER (WHERE NOT b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as undorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS FALSE), 0
          ), 0
      )
    ) as total_undorsement_wagers,
    (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id) as total_wager,
    seasons.id,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(eb.wager) 
            FROM enhanced_bets eb WHERE eb.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(eb.wager) 
                FROM enhanced_bets eb 
                WHERE eb.prediction_id = p.id 
                AND eb.endorsed IS TRUE
              ),
              0
            ),
            0.5
          ))::INT,
          COALESCE(seasons.payout_formula, (SELECT payout_formula FROM current_season_payout_formula))
        ), 2
      )
    ) as endorsement_ratio,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(eb.wager)
            FROM enhanced_bets eb WHERE eb.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(eb.wager)
                FROM enhanced_bets eb 
                WHERE eb.prediction_id = p.id 
                AND eb.endorsed IS FALSE
              ),
              0
            ),
            0.5
          ))::INT,
          COALESCE(seasons.payout_formula, (SELECT payout_formula FROM current_season_payout_formula))
        ), 2
      )
    ) as undorsement_ratio
  FROM predictions p
  LEFT JOIN seasons ON 
    COALESCE(p.closed_date, p.due_date) >= seasons.start AND p.due_date < seasons.end
  ORDER BY ID;