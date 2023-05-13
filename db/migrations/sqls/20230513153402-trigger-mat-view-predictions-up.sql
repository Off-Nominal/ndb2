/* Replace with your SQL commands */

BEGIN;

-- Update predictions to have status and season_id column
ALTER TABLE predictions 
  ADD COLUMN status TEXT,
  ADD COLUMN season_id INTEGER;

-- Update to reflect current data
UPDATE predictions
  SET season_id = 
    (SELECT id FROM seasons s WHERE COALESCE(predictions.closed_date, predictions.due_date) >= s.start AND COALESCE(predictions.closed_date, predictions.due_date) < s.end),
  status = 
    (CASE
      WHEN retired_date IS NOT NULL THEN 'retired'
      WHEN judged_date IS NOT NULL THEN
        CASE 
          WHEN 
            (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = predictions.id)
              THEN 'successful'
          ELSE 'failed'
        END
      WHEN closed_date IS NOT NULL THEN 'closed'
      ELSE 'open'
    END);

-- Create trigger function for refreshing status on a single prediction
CREATE FUNCTION refresh_status() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions
      SET status =     
        (CASE
          WHEN new.retired_date IS NOT NULL THEN 'retired'
          WHEN new.judged_date IS NOT NULL THEN
            CASE 
              WHEN 
                (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = new.id)
                  THEN 'successful'
              ELSE 'failed'
            END
          WHEN new.closed_date IS NOT NULL THEN 'closed'
          ELSE 'open'
        END)
      WHERE predictions.id = new.id;
    RETURN new;
  END;
$$;

-- Create trigger function for refreshing season_id on a single prediction
CREATE FUNCTION refresh_season() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions
      SET season_id =     
        (SELECT id FROM seasons s WHERE COALESCE(new.closed_date, new.due_date) >= s.start AND COALESCE(new.closed_date, new.due_date) < s.end)
      WHERE predictions.id = new.id;
    RETURN new;
  END;
$$;

-- Create trigger function for refreshing all seasons
CREATE FUNCTION refresh_seasons() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions
      SET season_id =     
        (SELECT id FROM seasons s WHERE COALESCE(predictions.closed_date, predictions.due_date) >= s.start AND COALESCE(predictions.closed_date, predictions.due_date) < s.end);
    RETURN new;
  END;
$$;

-- Triggers for Inserts
CREATE TRIGGER prediction_insert_season AFTER INSERT ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_season();

CREATE TRIGGER prediction_insert_status AFTER INSERT ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_status();

-- Trigger for Updates to Season
CREATE TRIGGER prediction_update_season AFTER UPDATE of closed_date, due_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_season();

-- Trigger for Updates to Status
CREATE TRIGGER prediction_update_status AFTER UPDATE of retired_date, closed_date, triggered_date, judged_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_status();

-- Trigger for Updates to Seasons
CREATE TRIGGER season_insert_or_update AFTER INSERT OR UPDATE OR DELETE ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_seasons();

DROP VIEW IF EXISTS enhanced_votes;

DROP VIEW IF EXISTS payouts;

DROP VIEW IF EXISTS enhanced_predictions;

DROP VIEW IF EXISTS enhanced_bets;

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
    p.status,
    p.season_id
  FROM bets b
  JOIN predictions p on b.prediction_id = p.id;
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
    p.season_id,
    p.status,
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
          COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM current_season_payout_formula))
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
          COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM current_season_payout_formula))
        ), 2
      )
    ) as undorsement_ratio
  FROM predictions p
  ORDER BY p.id;

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

COMMIT;