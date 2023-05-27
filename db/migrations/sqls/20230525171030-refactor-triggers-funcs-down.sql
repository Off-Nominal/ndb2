/* Replace with your SQL commands */
BEGIN;

DROP TRIGGER bet_payout_update_from_prediction ON predictions;
DROP TRIGGER bet_payout_update_from_season ON seasons;

DROP FUNCTION refresh_payouts_from_season;
DROP FUNCTION refresh_payouts_from_prediction;

ALTER TABLE bets
  DROP COLUMN season_payout;

ALTER TABLE seasons
  DROP COLUMN wager_cap;

CREATE OR REPLACE VIEW enhanced_predictions AS
  WITH recent_season_payout_formula AS (
    SELECT payout_formula
    FROM seasons
    ORDER BY start DESC
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
    (SELECT COUNT(id) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b) as endorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
          ), 0
      )
    ) as total_endorsement_wagers,
    (SELECT COUNT(id) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS FALSE AND b.valid IS TRUE) FROM bets b) as undorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS FALSE AND b.valid IS TRUE) FROM bets b), 0
          ), 0
      )
    ) as total_undorsement_wagers,
    (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b) as total_wager,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
          (COALESCE(
            NULLIF(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
              ), 0.5
          ))::DECIMAL,
          COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM recent_season_payout_formula))
        ), 2
      )
    ) as endorsement_ratio,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE)
            FROM bets b)::INT,
          (COALESCE(
            NULLIF(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS FALSE AND b.valid IS TRUE)
                FROM bets b
              ),
              0
            ),
            0.5
          ))::DECIMAL,
          COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM recent_season_payout_formula))
        ), 2
      )
    ) as undorsement_ratio
  FROM predictions p
  ORDER BY p.id;

DROP VIEW IF EXISTS enhanced_votes;

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

DROP TRIGGER prediction_payout_ratio_from_seasons ON seasons;
DROP TRIGGER prediction_payout_ratio_from_prediction ON predictions;
DROP TRIGGER prediction_payout_ratio_from_bet ON bets;

DROP FUNCTION refresh_prediction_ratios_from_season;
DROP FUNCTION refresh_prediction_ratios_from_prediction;
DROP FUNCTION refresh_prediction_ratios_from_bet;

ALTER TABLE predictions
  DROP COLUMN endorse_ratio,
  DROP COLUMN undorse_ratio;

DROP TRIGGER bet_valid_update_from_prediction ON predictions;
DROP TRIGGER bet_valid_update_from_bet ON bets;

DROP FUNCTION refresh_valid;

CREATE FUNCTION refresh_bet_payout_and_validity() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets
      SET 
        valid = COALESCE(bets.date < NEW.closed_date, TRUE),
        payout = 
          (CASE
            WHEN NEW.status = 'open' THEN NULL
            WHEN NEW.status = 'retired' THEN NULL
            WHEN bets.date >= NEW.closed_date THEN NULL
            WHEN NEW.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    bets.wager *
                    (CASE
                      WHEN NEW.status = 'successful'
                        THEN ep.endorsement_ratio
                        ELSE ep.undorsement_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (NEW.status = 'successful' AND bets.endorsed IS TRUE) OR 
                  (NEW.status = 'failed' AND bets.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END)
      FROM enhanced_predictions ep
      WHERE bets.prediction_id = NEW.id AND ep.prediction_id = NEW.id;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER predictions_update_bets_payout AFTER UPDATE of status ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_bet_payout_and_validity();

DROP TRIGGER bet_wager_update_from_prediction ON predictions;
DROP TRIGGER bet_wager_update_from_bet ON bets;

DROP FUNCTION refresh_wager;

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
      WHERE p.id = new.prediction_id AND bets.id = new.id;
    RETURN new;
  END;
$$;

-- Triggers for Updates
CREATE TRIGGER predictions_bets_wager_update AFTER UPDATE of due_date, closed_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager_from_predictions();

-- Triggers for Inserts
CREATE TRIGGER predictions_bets_wager_insert AFTER INSERT ON bets
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager_from_bets();

DROP TRIGGER prediction_status_update_from_prediction ON predictions;

ALTER FUNCTION refresh_prediction_status RENAME TO refresh_status;

CREATE TRIGGER prediction_update_status AFTER UPDATE of retired_date, closed_date, judged_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_status();

CREATE TRIGGER prediction_insert_status AFTER INSERT ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_status();

DROP TRIGGER prediction_season_update_from_season ON seasons;
DROP TRIGGER prediction_season_update_from_prediction ON predictions;

DROP FUNCTION refresh_prediction_seasons;

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

CREATE TRIGGER prediction_insert_season AFTER INSERT ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_season();

CREATE TRIGGER prediction_update_season AFTER UPDATE of closed_date, due_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_season();

CREATE TRIGGER season_insert_or_delete AFTER INSERT OR DELETE ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_seasons();

CREATE TRIGGER season_update AFTER UPDATE of "start", "end" ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_seasons();

COMMIT;