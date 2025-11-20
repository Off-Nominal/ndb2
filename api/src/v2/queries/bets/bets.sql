/* @name getBetsByPredictionId */
SELECT 
    b.id,
    b.prediction_id,
    b.user_id as better_id,
    u.discord_id as better_discord_id,
    b.date,
    b.endorsed,
    b.wager,
    b.valid,
    b.payout,
    b.season_payout
  FROM bets b
  JOIN users u ON u.id = b.user_id
  WHERE b.prediction_id = :prediction_id!
  ORDER BY date ASC;

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