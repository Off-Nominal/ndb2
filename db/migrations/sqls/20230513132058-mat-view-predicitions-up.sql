/* Replace with your SQL commands */

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS predictions_with_context;

CREATE MATERIALIZED VIEW predictions_with_context AS
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
    s.id as season_id,
    (CASE
      WHEN p.retired_date IS NOT NULL THEN 'retired'
      WHEN p.judged_date IS NOT NULL THEN
        CASE 
          WHEN 
            (SELECT mode() WITHIN GROUP (order by votes.vote) FROM votes WHERE votes.prediction_id = p.id)
              THEN 'successful'
          ELSE 'failed'
        END
      WHEN p.closed_date IS NOT NULL THEN 'closed'
      ELSE 'open'
    END) as status
  FROM predictions p
    LEFT JOIN seasons s ON 
    COALESCE(p.closed_date, p.due_date) >= s.start AND p.due_date < s.end
  ORDER BY p.id;

  COMMIT;