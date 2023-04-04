/* Replace with your SQL commands */

DROP VIEW IF EXISTS enhanved_votes;

DROP VIEW IF EXISTS payouts;

DROP VIEW IF EXISTS enhanced_predictions;

DROP INDEX IF EXISTS predictions_id_due_date_closed_date_idx;

DROP VIEW IF EXISTS enhanced_bets;

DROP FUNCTION IF EXISTS calc_payout_ratio;