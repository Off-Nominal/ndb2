/* Replace with your SQL commands */

BEGIN;

-- Drop all views
DROP VIEW IF EXISTS enhanced_votes;
DROP VIEW IF EXISTS payouts;
DROP VIEW IF EXISTS enhanced_predictions;
DROP VIEW IF EXISTS enhanced_bets;

-- Reset them to previous state
CREATE VIEW enhanced_bets AS
  SELECT
    b.id as bet_id,
    b.user_id as better_id,
    b.date as bet_date,
    b.endorsed,
    (SELECT 
      COALESCE(
        NULLIF(
          EXTRACT(
            DAY FROM
              COALESCE(p.closed_date, p.due_date) - b.date
          ),
          0
        ),
        1
      )
    )::INT as wager,
    b.prediction_id,
    p.user_id as predictor_id,
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
    seasons.id as season_id
  FROM bets b
  JOIN predictions p on b.prediction_id = p.id
  LEFT JOIN seasons ON 
    COALESCE(p.closed_date, p.due_date) >= seasons.start AND p.due_date < seasons.end;

CREATE VIEW enhanced_predictions AS
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

CREATE VIEW payouts AS
  SELECT
    eb.bet_id,
    eb.better_id,
    eb.endorsed,
    eb.wager,
    eb.prediction_id,
    eb.predictor_id,
    eb.status,
    ep.endorsement_ratio,
    ep.undorsement_ratio,
    ep.season_id,
    (SELECT 
      COALESCE(
        NULLIF(
          FLOOR(
            eb.wager *
            (CASE
              WHEN eb.status = 'successful'
              THEN ep.endorsement_ratio
              ELSE ep.undorsement_ratio
            END)
          ), 0
        ), 1
      )  *
      (CASE
        WHEN 
          (eb.status = 'successful' AND eb.endorsed IS TRUE) OR 
          (eb.status = 'failed' AND eb.endorsed IS FALSE)
        THEN 1
        ELSE -1
      END)
    ) as payout
  FROM enhanced_bets eb
  JOIN enhanced_predictions ep ON ep.prediction_id = eb.prediction_id
  WHERE eb.status = 'successful' OR eb.status = 'failed';

CREATE VIEW enhanced_votes AS
  SELECT 
    v.id,
    v.vote,
    v.voted_date,
    v.prediction_id,
    v.user_id as voter_id,
    ep.status,
    ep.season_id,
    (SELECT 
      CASE
        WHEN 
          ep.status = 'successful'
          THEN v.vote IS TRUE
        WHEN           
          ep.status = 'failed'
          THEN v.vote IS FALSE
        ELSE NULL
      END
    ) as popular_vote
  FROM votes v
  JOIN enhanced_predictions ep ON ep.prediction_id = v.prediction_id;

-- Drop all triggers and functions
DROP TRIGGER prediction_insert_season ON predictions;
DROP TRIGGER prediction_insert_status ON predictions;
DROP TRIGGER prediction_update_season ON predictions;
DROP TRIGGER prediction_update_status ON predictions;
DROP TRIGGER season_insert_or_update ON seasons;

DROP FUNCTION refresh_status;
DROP FUNCTION refresh_season;
DROP FUNCTION refresh_seasons;

ALTER TABLE predictions
  DROP COLUMN status,
  DROP COLUMN season_id;

COMMIT;