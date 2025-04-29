/* Replace with your SQL commands */

BEGIN;

ALTER TABLE bets
  ADD COLUMN valid BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN payout INT DEFAULT NULL;

UPDATE bets
  SET 
    valid = COALESCE(bets.date < ep.closed_date, TRUE),
    payout = 
      (CASE
        WHEN ep.status = 'open' THEN NULL
        WHEN ep.status = 'retired' THEN NULL
        WHEN bets.date >= ep.closed_date THEN NULL
        WHEN ep.status = 'closed' THEN NULL
        ELSE COALESCE(
            NULLIF(
              FLOOR(
                bets.wager *
                (CASE
                  WHEN ep.status = 'successful'
                    THEN ep.endorsement_ratio
                    ELSE ep.undorsement_ratio
                END)
              ), 0
            ), 1
          ) *
          (CASE
            WHEN 
              (ep.status = 'successful' AND bets.endorsed IS TRUE) OR 
              (ep.status = 'failed' AND bets.endorsed IS FALSE)
            THEN 1
            ELSE -1
          END)
        END)
  FROM enhanced_predictions ep
  WHERE bets.prediction_id = ep.prediction_id;
      
-- keep in sync
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

DROP VIEW payouts;

COMMIT;