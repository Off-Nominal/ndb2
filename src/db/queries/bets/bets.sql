/* @name getBetsByUserId */
SELECT
    id,
    prediction_id,
    date,
    endorsed,
    wager,
    valid,
    payout,
    season_payout
  FROM bets b
  WHERE b.user_id = :user_id!;

  /* @name addBet */
  INSERT INTO bets (
    user_id,
    prediction_id,
    endorsed,
    date
  ) VALUES (
    :user_id!,
    :prediction_id!,
    :endorsed!,
    :date!
  ) 
  ON CONFLICT (user_id, prediction_id) 
  DO UPDATE SET endorsed = :endorsed!
  RETURNING id, user_id, prediction_id, date, endorsed, valid, payout;