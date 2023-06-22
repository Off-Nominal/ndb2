/* Replace with your SQL commands */
BEGIN;

CREATE OR REPLACE FUNCTION refresh_prediction_season_applicable() RETURNS trigger
  SECURITY definer
  LANGUAGE plpgsql
AS $$
  BEGIN
    UPDATE predictions p
      SET season_applicable = COALESCE((SELECT NOT closed FROM seasons s WHERE s.id = NEW.season_id), true)
      WHERE p.id = NEW.id;
    RETURN NEW;
  END;
$$;

COMMIT;