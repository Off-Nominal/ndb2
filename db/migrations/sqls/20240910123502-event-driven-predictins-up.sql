/* Replace with your SQL commands */

BEGIN;

ALTER TABLE predictions
  ALTER COLUMN due_date DROP NOT NULL;

ALTER TABLE predictions
  ADD COLUMN driver TEXT NOT NULL DEFAULT 'date' CHECK (driver in ('event', 'date')),
  ADD COLUMN check_date TIMESTAMPTZ,
  ADD COLUMN last_check_date TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS checks (
  id SERIAL PRIMARY KEY,
  prediction_id INT REFERENCES predictions(id) ON DELETE CASCADE,
  check_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed BOOLEAN NOT NULL DEFAULT false,
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_checks (
  check_id INT REFERENCES checks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  value SMALLINT NOT NULL CHECK (value in (0, 1, 7, 30, 90, 365)),
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT user_checks_pkey PRIMARY KEY (check_id, user_id)
);


-- Trigger Function to update status for changes to last_update_check and check_date
DROP TRIGGER prediction_status_update_from_prediction ON predictions;

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
                  (SELECT 1 FROM checks WHERE prediction_id = new.id AND closed = false)
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

CREATE TRIGGER prediction_status_update_from_checks AFTER UPDATE of closed ON checks
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_status();

-- trigger Function to update season when check_date changes
DROP TRIGGER prediction_season_update_from_prediction ON predictions;

CREATE OR REPLACE FUNCTION refresh_prediction_seasons() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions p
      SET season_id =     
        (SELECT id 
          FROM seasons s 
          WHERE COALESCE(p.closed_date, p.due_date, p.check_date) > s.start 
            AND COALESCE(p.closed_date, p.due_date, p.check_date) <= s.end
        )
      WHERE (TG_ARGV[0] = 'all') OR (TG_ARGV[0] = 'prediction' AND p.id = NEW.id);
    RETURN NEW;
  END;
$$;

CREATE TRIGGER prediction_season_update_from_prediction AFTER INSERT OR UPDATE of closed_date, due_date, check_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_seasons('prediction');

-- Trigger function to update wager on check_date change
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
                  COALESCE(p.closed_date, p.due_date, p.check_date) - b.date
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

CREATE TRIGGER bet_wager_update_from_prediction AFTER UPDATE of due_date, closed_date, check_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_wager('prediction');

-- trigger function to update last_check_date on insert to checks
CREATE FUNCTION refresh_last_checked_date() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions p
      SET last_check_date = (
        SELECT
          MAX(check_date)
        FROM checks
        WHERE prediction_id = NEW.prediction_id
      )
      WHERE p.id = NEW.prediction_id;
    RETURN NEW;
  END;
$$;

CREATE TRIGGER prediction_last_check_date_from_checks AFTER INSERT ON checks
  FOR EACH ROW EXECUTE PROCEDURE refresh_last_checked_date();

COMMIT;