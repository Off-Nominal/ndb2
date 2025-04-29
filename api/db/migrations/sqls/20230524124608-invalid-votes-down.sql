/* Replace with your SQL commands */

BEGIN;

CREATE OR REPLACE VIEW payouts AS
  SELECT
    b.id as bet_id,
    b.user_id as better_id,
    b.endorsed,
    b.wager,
    b.prediction_id,
    ep.predictor_id,
    ep.status,
    ep.endorsement_ratio,
    ep.undorsement_ratio,
    ep.season_id,
    (SELECT 
      COALESCE(
        NULLIF(
          FLOOR(
            b.wager *
            (CASE
              WHEN ep.status = 'successful'
              THEN ep.endorsement_ratio
              ELSE ep.undorsement_ratio
            END)
          ), 0
        ), 1
      )  *
      (CASE
        WHEN 
          (ep.status = 'successful' AND b.endorsed IS TRUE) OR 
          (ep.status = 'failed' AND b.endorsed IS FALSE)
        THEN 1
        ELSE -1
      END)
    ) as payout
  FROM bets b
  JOIN enhanced_predictions ep ON ep.prediction_id = b.prediction_id
  WHERE ep.status = 'successful' OR ep.status = 'failed';

DROP TRIGGER predictions_update_bets_payout ON predictions;

DROP FUNCTION refresh_bet_payout_and_validity;

ALTER TABLE bets
  DROP COLUMN payout,
  DROP COLUMN valid;

COMMIT;