/* Replace with your SQL commands */
BEGIN;

-- refresh season changes

-- remove old triggers and functions
DROP TRIGGER prediction_insert_season ON predictions;
DROP TRIGGER prediction_update_season ON predictions;
DROP TRIGGER season_insert_or_delete ON seasons;
DROP TRIGGER season_update ON seasons;

DROP FUNCTION refresh_season;
DROP FUNCTION refresh_seasons;

-- Create trigger function for refreshing season that takes param
CREATE FUNCTION refresh_prediction_seasons() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions p
      SET season_id =     
        (SELECT id FROM seasons s WHERE COALESCE(p.closed_date, p.due_date) >= s.start AND COALESCE(p.closed_date, p.due_date) < s.end)
      WHERE (TG_ARGV[0] = 'all') OR (TG_ARGV[0] = 'prediction' AND p.id = NEW.id);
    RETURN NEW;
  END;
$$;

-- Create trigger function for refreshing season_id on a single prediction
CREATE TRIGGER prediction_season_update_from_prediction AFTER INSERT OR UPDATE of closed_date, due_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_seasons('prediction');

-- Create trigger function for refreshing season_id on all predictions
CREATE TRIGGER prediction_season_update_from_season AFTER INSERT OR DELETE OR UPDATE of "start", "end" ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_seasons('all');

-- refresh status changes

ALTER FUNCTION refresh_status RENAME TO refresh_prediction_status;

DROP TRIGGER prediction_insert_status ON predictions;
DROP TRIGGER prediction_update_status ON predictions;

CREATE TRIGGER prediction_status_update_from_prediction AFTER INSERT OR UPDATE of retired_date, closed_date, judged_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_status();

-- refresh wager

DROP TRIGGER predictions_bets_wager_update ON predictions;
DROP TRIGGER predictions_bets_wager_insert ON bets;

DROP FUNCTION refresh_wager_from_predictions;
DROP FUNCTION refresh_wager_from_bets;

CREATE FUNCTION refresh_wager() RETURNS trigger
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
                  COALESCE(p.closed_date, p.due_date) - b.date
              ),
              0
            ),
            1
          )
        )::INT
      FROM predictions p
      WHERE p.id = b.prediction_id AND ((TG_ARGV[0] = 'bet' AND b.id = NEW.id) OR (TG_ARGV[0] = 'prediction' AND p.id = NEW.id));
    RETURN NEW;
  END;
$$;

-- Triggers for Updates
CREATE TRIGGER bet_wager_update_from_prediction AFTER UPDATE of due_date, closed_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager('prediction');

-- Triggers for Inserts
CREATE TRIGGER bet_wager_update_from_bet AFTER INSERT ON bets
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager('bet');

-- refresh bet validity

DROP TRIGGER predictions_update_bets_payout ON predictions;

DROP FUNCTION refresh_bet_payout_and_validity;

CREATE FUNCTION refresh_valid() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets b
      SET valid = COALESCE(b.date < p.closed_date, TRUE)
      FROM predictions p
      WHERE p.id = b.prediction_id AND ((TG_ARGV[0] = 'bet' AND b.id = NEW.id) OR (TG_ARGV[0] = 'prediction' AND b.prediction_id = new.id));
    RETURN new;
  END;
$$;

CREATE TRIGGER bet_valid_update_from_prediction AFTER UPDATE of closed_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_valid('prediction');

CREATE TRIGGER bet_valid_update_from_bet AFTER UPDATE of "date" ON bets
  FOR EACH ROW EXECUTE PROCEDURE refresh_valid('bet');

-- Remove Enhanced Predictions views 

ALTER TABLE predictions
  ADD COLUMN endorse_ratio DECIMAL NOT NULL DEFAULT 1,
  ADD COLUMN undorse_ratio DECIMAL NOT NULL DEFAULT 1;

WITH recent_season_payout_formula AS (
  SELECT payout_formula
  FROM seasons
  ORDER BY start DESC
  LIMIT 1
)
UPDATE predictions p
  SET endorse_ratio = (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
          (COALESCE(
            NULLIF(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
              ), 0.5
          ))::DECIMAL,
          COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = p.season_id), (SELECT payout_formula FROM recent_season_payout_formula))
        ), 2
      )
    ),
  undorse_ratio = (SELECT 
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
    );

CREATE FUNCTION refresh_prediction_ratios_from_bet() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    WITH recent_season_payout_formula AS (
      SELECT payout_formula
      FROM seasons
      ORDER BY start DESC
      LIMIT 1
    )     
    UPDATE predictions p
      SET endorse_ratio = (SELECT 
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
                  ), 0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = p.season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        ),
      undorse_ratio = (SELECT 
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
        )
      WHERE p.id = NEW.prediction_id;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER prediction_payout_ratio_from_bet AFTER UPDATE of valid, endorsed, wager ON bets
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_ratios_from_bet();

CREATE FUNCTION refresh_prediction_ratios_from_prediction() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    WITH recent_season_payout_formula AS (
      SELECT payout_formula
      FROM seasons
      ORDER BY start DESC
      LIMIT 1
    )     
    UPDATE predictions p
      SET endorse_ratio = (SELECT 
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
                  ), 0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = p.season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        ),
      undorse_ratio = (SELECT 
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
        )
      WHERE p.id = NEW.id AND (SELECT count(*) FROM bets WHERE bets.prediction_id = NEW.id) > 0;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER prediction_payout_ratio_from_prediction AFTER UPDATE of season_id ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_ratios_from_prediction();

CREATE FUNCTION refresh_prediction_ratios_from_season() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    WITH recent_season_payout_formula AS (
      SELECT payout_formula
      FROM seasons
      ORDER BY start DESC
      LIMIT 1
    )     
    UPDATE predictions p
      SET endorse_ratio = (SELECT 
          ROUND(
            calc_payout_ratio(
              (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.valid IS TRUE) FROM bets b)::INT,
              (COALESCE(
                NULLIF(
                  (SELECT SUM(b.wager) FILTER (WHERE b.prediction_id = p.id AND b.endorsed IS TRUE AND b.valid IS TRUE) FROM bets b), 0
                  ), 0.5
              ))::DECIMAL,
              COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = p.season_id), (SELECT payout_formula FROM recent_season_payout_formula))
            ), 2
          )
        ),
      undorse_ratio = (SELECT 
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
        )
      WHERE p.season_id = NEW.id;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER prediction_payout_ratio_from_seasons AFTER UPDATE of payout_formula ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_ratios_from_season();

DROP VIEW IF EXISTS enhanced_votes;

CREATE VIEW enhanced_votes AS
  SELECT 
    v.id,
    v.vote,
    v.voted_date,
    v.prediction_id,
    v.user_id as voter_id,
    p.status,
    p.season_id,
    (SELECT 
      CASE
        WHEN 
          p.status = 'successful'
          THEN v.vote IS TRUE
        WHEN           
          p.status = 'failed'
          THEN v.vote IS FALSE
        ELSE NULL
      END
    ) as popular_vote
  FROM votes v
  JOIN predictions p ON p.id = v.prediction_id;

DROP VIEW IF EXISTS enhanced_predictions;

-- Add new season wager cap and season payout columns

ALTER TABLE seasons
  ADD COLUMN wager_cap INTEGER NOT NULL DEFAULT 90;

UPDATE seasons
  SET wager_cap = 
    EXTRACT(
      DAY FROM
        "end" - start
    );

ALTER TABLE bets
  ADD COLUMN season_payout INTEGER DEFAULT NULL;

UPDATE bets b
  SET 
    season_payout = 
      (CASE
        WHEN b.valid IS FALSE THEN NULL
        WHEN p.status = 'open' THEN NULL
        WHEN p.status = 'retired' THEN NULL
        WHEN p.status = 'closed' THEN NULL
        ELSE COALESCE(
            NULLIF(
              FLOOR(
                LEAST(b.wager, s.wager_cap) *
                (CASE
                  WHEN p.status = 'successful'
                    THEN p.endorse_ratio
                    ELSE p.undorse_ratio
                END)
              ), 0
            ), 1
          ) *
          (CASE
            WHEN 
              (p.status = 'successful' AND b.endorsed IS TRUE) OR 
              (p.status = 'failed' AND b.endorsed IS FALSE)
            THEN 1
            ELSE -1
          END)
        END)
  FROM predictions p
    JOIN seasons s ON p.season_id = s.id
  WHERE b.prediction_id = p.id;

CREATE FUNCTION refresh_payouts_from_prediction() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets b
      SET 
        payout = 
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    b.wager *
                    (CASE
                      WHEN p.status = 'successful'
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END),
        season_payout =
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    LEAST(b.wager, s.wager_cap) *
                    (CASE
                      WHEN p.status = 'successful'
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END)
      FROM predictions p
      JOIN seasons s ON p.season_id = s.id
      WHERE p.id = b.prediction_id AND b.id = NEW.id;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER bet_payout_update_from_prediction AFTER UPDATE of status, endorse_ratio, undorse_ratio ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_payouts_from_prediction();

CREATE FUNCTION refresh_payouts_from_season() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE bets b
      SET 
        payout = 
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    b.wager *
                    (CASE
                      WHEN p.status = 'successful'
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END),
        season_payout =
          (CASE
            WHEN b.valid IS FALSE THEN NULL
            WHEN p.status = 'open' THEN NULL
            WHEN p.status = 'retired' THEN NULL
            WHEN p.status = 'closed' THEN NULL
            ELSE COALESCE(
                NULLIF(
                  FLOOR(
                    LEAST(b.wager, s.wager_cap) *
                    (CASE
                      WHEN p.status = 'successful'
                        THEN p.endorse_ratio
                        ELSE p.undorse_ratio
                    END)
                  ), 0
                ), 1
              ) *
              (CASE
                WHEN 
                  (p.status = 'successful' AND b.endorsed IS TRUE) OR 
                  (p.status = 'failed' AND b.endorsed IS FALSE)
                THEN 1
                ELSE -1
              END)
            END)
      FROM predictions p
      JOIN seasons s ON p.season_id = s.id
      WHERE p.season_id = NEW.id;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER bet_payout_update_from_season AFTER UPDATE of payout_formula, wager_cap ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_payouts_from_season();

COMMIT;