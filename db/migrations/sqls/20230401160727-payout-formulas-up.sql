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

CREATE OR REPLACE VIEW enhanced_bets AS
  SELECT
    b.id as bet_id,
    b.user_id as better_id,
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
    END) as status,
    seasons.id as season_id
  FROM bets b
  JOIN predictions p on b.prediction_id = p.id
  LEFT JOIN seasons ON 
    COALESCE(p.closed_date, p.due_date) >= seasons.start AND p.due_date < seasons.end;

CREATE INDEX predictions_id_due_date_closed_date_idx ON predictions (id, due_date, closed_date);

CREATE VIEW enhanced_predictions AS
  SELECT
    p.id as prediction_id,
    p.user_id as predictor_id,
    seasons.id as season_id,
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
    END) as status,
    (SELECT COUNT(id) FILTER (WHERE b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as endorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS TRUE), 0
          ), 0
      )
    ) as total_endorsement_wagers,
    (SELECT COUNT(id) FILTER (WHERE NOT b.endorsed) FROM bets b WHERE b.prediction_id = p.id) as undorsements,
    (SELECT 
      COALESCE(
        NULLIF(
          (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id AND eb.endorsed IS FALSE), 0
          ), 0
      )
    ) as total_undorsement_wagers,
    (SELECT SUM(eb.wager) FROM enhanced_bets eb WHERE eb.prediction_id = p.id) as total_wager,
    seasons.id,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(eb.wager) 
            FROM enhanced_bets eb WHERE eb.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(eb.wager) 
                FROM enhanced_bets eb 
                WHERE eb.prediction_id = p.id 
                AND eb.endorsed IS TRUE
              ),
              0
            ),
            0.5
          ))::INT,
          seasons.payout_formula
        ), 2
      )
    ) as endorsement_ratio,
    (SELECT 
      ROUND(
        calc_payout_ratio(
          (SELECT SUM(eb.wager)
            FROM enhanced_bets eb WHERE eb.prediction_id = p.id)::INT,
          (COALESCE(
            NULLIF(
              (SELECT 
                  SUM(eb.wager)
                FROM enhanced_bets eb 
                WHERE eb.prediction_id = p.id 
                AND eb.endorsed IS FALSE
              ),
              0
            ),
            0.5
          ))::INT,
          seasons.payout_formula
        ), 2
      )
    ) as undorsement_ratio
  FROM predictions p
  LEFT JOIN seasons ON 
    COALESCE(p.closed_date, p.due_date) >= seasons.start AND p.due_date < seasons.end
  ORDER BY ID;

CREATE VIEW payouts AS
  SELECT
    eb.bet_id,
    eb.better_id,
    eb.endorsed,
    eb.wager,
    eb.prediction_id,
    eb.predictor_id,
    eb.status,
    ep.endorsement_ratio,
    ep.undorsement_ratio,
    ep.season_id,
    (SELECT 
      COALESCE(
        NULLIF(
          FLOOR(
            eb.wager *
            (CASE
              WHEN eb.status = 'successful'
              THEN ep.endorsement_ratio
              ELSE ep.undorsement_ratio
            END)
          ), 0
        ), 1
      )  *
      (CASE
        WHEN 
          (eb.status = 'successful' AND eb.endorsed IS TRUE) OR 
          (eb.status = 'failed' AND eb.endorsed IS FALSE)
        THEN 1
        ELSE -1
      END)
    ) as payout
  FROM enhanced_bets eb
  JOIN enhanced_predictions ep ON ep.prediction_id = eb.prediction_id
  WHERE eb.status = 'successful' OR eb.status = 'failed';

CREATE INDEX predictions_predictor_id_idx ON predictions (user_id);

CREATE INDEX bets_prediction_id_idx ON bets (prediction_id);

COMMIT;