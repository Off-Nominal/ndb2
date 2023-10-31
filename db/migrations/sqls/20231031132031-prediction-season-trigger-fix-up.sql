/* Replace with your SQL commands */

BEGIN;

DROP TRIGGER prediction_season_update_from_prediction ON predictions;
DROP TRIGGER prediction_season_update_from_season ON seasons;

DROP FUNCTION refresh_prediction_seasons;

-- start and end <= >= swapped to align with business logic
CREATE FUNCTION refresh_prediction_seasons() RETURNS trigger
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

COMMIT;

-- Create trigger function for refreshing season_id on a single prediction
CREATE TRIGGER prediction_season_update_from_prediction AFTER INSERT OR UPDATE of closed_date, due_date ON predictions
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_seasons('prediction');

-- Create trigger function for refreshing season_id on all predictions
CREATE TRIGGER prediction_season_update_from_season AFTER INSERT OR DELETE OR UPDATE of "start", "end" ON seasons
  FOR EACH ROW EXECUTE PROCEDURE refresh_prediction_seasons('all');