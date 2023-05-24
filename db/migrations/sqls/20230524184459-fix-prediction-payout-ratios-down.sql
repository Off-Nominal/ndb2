/* Replace with your SQL commands */
BEGIN;

CREATE OR REPLACE FUNCTION calc_payout_ratio(
      w int -- total wager day point value for prediction
    , s int -- specific wager for type of bet you wish to calculate,
    , f text -- formula to input variables into
    , OUT result numeric)
  RETURNS numeric
  LANGUAGE plpgsql IMMUTABLE AS
$func$
BEGIN
  EXECUTE 'SELECT ' || f
  INTO result
  USING $1, $2, $3;
END
$func$;

CREATE OR REPLACE VIEW enhanced_predictions AS
  WITH current_season_payout_formula AS (
    SELECT payout_formula
    FROM seasons
    WHERE NOW() >= seasons.start AND NOW() < seasons.end
    LIMIT 1
  )
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
    p.season_id,
    p.status,
    (SELECT COUNT(id) FILTER (WHERE b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as endorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(b.wager) FROM bets b WHERE b.prediction_id = p.id AND b.endorsed IS TRUE), 0
          ), 0
      )
    ) as total_endorsement_wagers,
    (SELECT COUNT(id) FILTER (WHERE NOT b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as undorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(b.wager) FROM bets b WHERE b.prediction_id = p.id AND b.endorsed IS FALSE), 0
          ), 0
      )
    ) as total_undorsement_wagers,
    (SELECT SUM(b.wager) FROM bets b WHERE b.prediction_id = p.id) as total_wager,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(b.wager) 
            FROM bets b WHERE b.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(b.wager) 
                FROM bets b 
                WHERE b.prediction_id = p.id 
                AND b.endorsed IS TRUE
              ),
              0
            ),
            0.5
          ))::INT,
          COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM current_season_payout_formula))
        ), 2
      )
    ) as endorsement_ratio,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(b.wager)
            FROM bets b WHERE b.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(b.wager)
                FROM bets b 
                WHERE b.prediction_id = p.id 
                AND b.endorsed IS FALSE
              ),
              0
            ),
            0.5
          ))::INT,
          COALESCE((SELECT payout_formula FROM seasons WHERE seasons.id = season_id), (SELECT payout_formula FROM current_season_payout_formula))
        ), 2
      )
    ) as undorsement_ratio
  FROM predictions p
  ORDER BY p.id;

DROP FUNCTION calc_payout_ratio(
      w int -- total wager day point value for prediction
    , s decimal -- specific wager for type of bet you wish to calculate,
    , f text -- formula to input ;variables into
    , OUT result numeric);

COMMIT;