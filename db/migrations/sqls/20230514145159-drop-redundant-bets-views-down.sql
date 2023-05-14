/* Replace with your SQL commands */

BEGIN;


CREATE VIEW enhanced_bets AS
  SELECT
    b.id as bet_id,
    b.user_id as better_id,
    b.date as bet_date,
    b.endorsed,
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
    )::INT as wager,
    b.prediction_id,
    p.user_id as predictor_id,
    p.status,
    p.season_id
  FROM bets b
  JOIN predictions p on b.prediction_id = p.id;

COMMIT;