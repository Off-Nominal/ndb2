/* Replace with your SQL commands */

BEGIN;

-- Drop Existing Indexes
DROP INDEX IF EXISTS predictions_id_due_date_closed_date_idx;
DROP INDEX IF EXISTS predictions_predictor_id_idx;
DROP INDEX IF EXISTS bets_user_id_idx;

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
CREATE TRIGGER prediction_update_status AFTER UPDATE of retired_date, closed_date, judged_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_status();

-- Trigger for Updates to Seasons
CREATE TRIGGER season_insert_or_delete AFTER INSERT OR DELETE ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_seasons();

CREATE TRIGGER season_update AFTER UPDATE of "start", "end" ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_seasons();

-- Update bets to have wager column
ALTER TABLE bets
  ADD COLUMN wager INTEGER;

-- Update to reflect current data
UPDATE bets b
  SET wager = 
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
    )::INT
  FROM predictions p
  WHERE p.id = b.prediction_id;

-- Create trigger function for refreshing wager on a prediction update
CREATE FUNCTION refresh_wager_from_predictions() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets b
      SET wager = 
        (SELECT 
        COALESCE(
          NULLIF(
            EXTRACT(
              DAY FROM
                COALESCE(new.closed_date, new.due_date) - b.date
            ),
            0
          ),
          1
        )
      )::INT
    WHERE new.id = b.prediction_id;
    RETURN new;
  END;
$$;
-- Create trigger function for refreshing wager on bet insert
CREATE FUNCTION refresh_wager_from_bets() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets
      SET wager = 
        (SELECT 
          COALESCE(
            NULLIF(
              EXTRACT(
                DAY FROM
                  COALESCE(p.closed_date, p.due_date) - new.date
              ),
              0
            ),
            1
          )
        )::INT
      FROM predictions p
      WHERE p.id = new.prediction_id;
    RETURN new;
  END;
$$;

-- Triggers for Updates
CREATE TRIGGER predictions_bets_wager_update AFTER UPDATE of due_date, closed_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager_from_predictions();

-- Triggers for Inserts
CREATE TRIGGER predictions_bets_wager_insert AFTER INSERT ON bets
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager_from_bets();

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
          (SELECT SUM(b.wager) FROM bets b WHERE b.prediction_id = p.id AND b.endorsed IS TRUE), 0
          ), 0
      )
    ) as total_endorsement_wagers,
    (SELECT COUNT(id) FILTER (WHERE NOT b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as undorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(b.wager) FROM bets b WHERE b.prediction_id = p.id AND b.endorsed IS FALSE), 0
          ), 0
      )
    ) as total_undorsement_wagers,
    (SELECT SUM(b.wager) FROM bets b WHERE b.prediction_id = p.id) as total_wager,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(b.wager) 
            FROM bets b WHERE b.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(b.wager) 
                FROM bets b 
                WHERE b.prediction_id = p.id 
                AND b.endorsed IS TRUE
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
          (SELECT SUM(b.wager)
            FROM bets b WHERE b.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(b.wager)
                FROM bets b 
                WHERE b.prediction_id = p.id 
                AND b.endorsed IS FALSE
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
    b.id as bet_id,
    b.user_id as better_id,
    b.endorsed,
    b.wager,
    b.prediction_id,
    ep.predictor_id,
    ep.status,
    ep.endorsement_ratio,
    ep.undorsement_ratio,
    ep.season_id,
    (SELECT 
      COALESCE(
        NULLIF(
          FLOOR(
            b.wager *
            (CASE
              WHEN ep.status = 'successful'
              THEN ep.endorsement_ratio
              ELSE ep.undorsement_ratio
            END)
          ), 0
        ), 1
      )  *
      (CASE
        WHEN 
          (ep.status = 'successful' AND b.endorsed IS TRUE) OR 
          (ep.status = 'failed' AND b.endorsed IS FALSE)
        THEN 1
        ELSE -1
      END)
    ) as payout
  FROM bets b
  JOIN enhanced_predictions ep ON ep.prediction_id = b.prediction_id
  WHERE ep.status = 'successful' OR ep.status = 'failed';

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