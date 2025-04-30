/* Replace with your SQL commands */

BEGIN;

-- Status 
CREATE TYPE prediction_status AS ENUM (
  'open',
  'checking',
  'retired',
  'closed',
  'successful',
  'failed'
);

CREATE CAST (prediction_status AS text) WITH INOUT AS IMPLICIT;

-- Triggers/Views must be dropped before changing the column type
DROP TRIGGER prediction_status_update_from_prediction ON predictions;

DROP TRIGGER  bet_payout_update_from_season on seasons;

DROP TRIGGER bet_payout_update_from_prediction  ON predictions;

DROP VIEW IF EXISTS enhanced_votes;

ALTER TABLE predictions 
  ALTER COLUMN status TYPE prediction_status USING (
    CASE
      WHEN status = 'open' THEN 'open'::prediction_status
      WHEN status = 'checking' THEN 'checking'::prediction_status
      WHEN status = 'retired' THEN 'retired'::prediction_status
      WHEN status = 'closed' THEN 'closed'::prediction_status
      WHEN status = 'successful' THEN 'successful'::prediction_status
      WHEN status = 'failed' THEN 'failed'::prediction_status
      ELSE NULL
    END);


CREATE OR REPLACE FUNCTION refresh_prediction_status() RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
  BEGIN
    UPDATE predictions
      SET status =     
        (CASE
          WHEN new.retired_date IS NOT NULL THEN 'retired'::prediction_status
          WHEN new.judged_date IS NOT NULL THEN
            CASE 
              WHEN 
                (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = new.id)
                  THEN 'successful'::prediction_status
              ELSE 'failed'::prediction_status
            END
          WHEN new.closed_date IS NOT NULL THEN 'closed'::prediction_status
          ELSE
            CASE
              WHEN
                (SELECT EXISTS 
                  (SELECT 1 FROM snooze_checks WHERE prediction_id = new.id AND closed = false)
                )
                THEN 'checking'::prediction_status
              ELSE 'open'::prediction_status
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

-- Driver
CREATE TYPE prediction_driver AS ENUM ('event', 'date');

CREATE CAST (prediction_driver AS text) WITH INOUT AS IMPLICIT;

ALTER TABLE predictions 
  ALTER COLUMN driver DROP DEFAULT;

ALTER TABLE predictions
  ALTER COLUMN driver TYPE prediction_driver USING (
    CASE
      WHEN driver = 'event' THEN 'event'::prediction_driver
      WHEN driver = 'date' THEN 'date'::prediction_driver
      ELSE 'date'
    END);

ALTER TABLE predictions
  ALTER COLUMN driver SET DEFAULT 'date'::prediction_driver;

ALTER TABLE predictions
  ALTER COLUMN status SET DEFAULT 'open'::prediction_status;

ALTER TABLE predictions
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE bets
  ALTER COLUMN wager SET DEFAULT 0;

ALTER TABLE bets
  ALTER COLUMN wager SET NOT NULL;

COMMIT;