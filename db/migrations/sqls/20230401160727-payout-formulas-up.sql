/* Replace with your SQL commands */

CREATE OR REPLACE FUNCTION calc_payout(
      w int -- total wager day point value for prediction
    , s int -- specific wager for type of bet you wish to calculate,
    , f text -- formula to input variables into
    , OUT result numeric)
  RETURNS numeric
  LANGUAGE plpgsql IMMUTABLE AS
$func$
BEGIN
  EXECUTE 'SELECT' || f
  INTO result
  USING $1, $2, $3;
END
$func$