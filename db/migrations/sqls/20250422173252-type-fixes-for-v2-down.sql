/* Replace with your SQL commands */

BEGIN;

DROP TRIGGER prediction_status_update_from_prediction ON predictions;

DROP TRIGGER  bet_payout_update_from_season on seasons;

DROP TRIGGER bet_payout_update_from_prediction  ON predictions;

DROP VIEW IF EXISTS enhanced_votes;

ALTER TABLE predictions
  ALTER COLUMN driver DROP DEFAULT;

ALTER TABLE predictions
  ALTER COLUMN driver TYPE TEXT USING (
    CASE
      WHEN driver = 'event' THEN 'event'
      WHEN driver = 'date' THEN 'date'
      ELSE 'date'
    END),
  ALTER COLUMN status TYPE TEXT USING (
    CASE
      WHEN status = 'open' THEN 'open'
      WHEN status = 'checking' THEN 'checking'
      WHEN status = 'retired' THEN 'retired'
      WHEN status = 'closed' THEN 'closed'
      WHEN status = 'successful' THEN 'successful'
      WHEN status = 'failed' THEN 'failed'
      ELSE NULL
    END);

ALTER TABLE predictions
  ALTER COLUMN driver SET DEFAULT 'date';

DROP CAST (prediction_status AS text);

DROP CAST (prediction_driver AS text);

DROP TYPE IF EXISTS prediction_driver;

DROP TYPE IF EXISTS prediction_status;

CREATE OR REPLACE FUNCTION refresh_prediction_status() RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
          ELSE
            CASE
              WHEN
                (SELECT EXISTS 
                  (SELECT 1 FROM snooze_checks WHERE prediction_id = new.id AND closed = false)
                )
                THEN 'checking'
              ELSE 'open'
            END
        END)
      WHERE predictions.id = new.id;
    RETURN new;
  END;
$$;

CREATE TRIGGER prediction_status_update_from_prediction AFTER INSERT OR UPDATE of retired_date, closed_date, judged_date, check_date, last_check_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_status();

CREATE TRIGGER bet_payout_update_from_season AFTER UPDATE of payout_formula, wager_cap ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_payouts_from_season();

CREATE TRIGGER bet_payout_update_from_prediction AFTER UPDATE of status, endorse_ratio, undorse_ratio ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_payouts_from_prediction();


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

COMMIT;