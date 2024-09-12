/* Replace with your SQL commands */

BEGIN;

DROP TRIGGER prediction_last_check_date_from_checks ON checks;

DROP FUNCTION IF EXISTS refresh_last_checked_date;

DROP TRIGGER bet_wager_update_from_prediction ON predictions;

CREATE OR REPLACE FUNCTION refresh_wager() RETURNS trigger
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

CREATE TRIGGER bet_wager_update_from_prediction AFTER UPDATE of due_date, closed_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager('prediction');

DROP TRIGGER prediction_season_update_from_prediction ON predictions;

CREATE OR REPLACE FUNCTION refresh_prediction_seasons() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions p
      SET season_id =     
        (SELECT id FROM seasons s WHERE COALESCE(p.closed_date, p.due_date) > s.start AND COALESCE(p.closed_date, p.due_date) <= s.end)
      WHERE (TG_ARGV[0] = 'all') OR (TG_ARGV[0] = 'prediction' AND p.id = NEW.id);
    RETURN NEW;
  END;
$$;

CREATE TRIGGER prediction_season_update_from_prediction AFTER INSERT OR UPDATE of closed_date, due_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_seasons('prediction');

DROP TRIGGER prediction_status_update_from_prediction ON predictions;
DROP TRIGGER prediction_status_update_from_checks ON checks;

CREATE OR REPLACE FUNCTION refresh_prediction_status() RETURNS trigger
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

CREATE TRIGGER prediction_status_update_from_prediction AFTER INSERT OR UPDATE of retired_date, closed_date, judged_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_status();

DROP TABLE user_checks;

DROP TABLE checks;

ALTER TABLE predictions
  ALTER COLUMN due_date SET NOT NULL;

ALTER TABLE predictions
  DROP COLUMN driver,
  DROP COLUMN check_date,
  DROP COLUMN last_check_date;

COMMIT;