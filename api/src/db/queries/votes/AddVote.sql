INSERT INTO votes (
  user_id,
  prediction_id,
  vote,
  voted_date
) VALUES (
  $1,
  $2,
  $3,
  NOW()
)
ON CONFLICT (user_id, prediction_id)
  DO UPDATE SET vote = $3 
RETURNING id, user_id, prediction_id, vote, voted_date;