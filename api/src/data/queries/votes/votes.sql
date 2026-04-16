/* @name getVotesByPredictionId */
SELECT 
  v.id,
  v.prediction_id, 
  u.id as voter_id,
  u.discord_id as voter_discord_id,
  voted_date,
  vote
FROM votes v
JOIN users u ON u.id = v.user_id
WHERE v.prediction_id = :prediction_id!
ORDER BY voted_date DESC;

/* @name addVote */
INSERT INTO votes (
  user_id,
  prediction_id,
  vote,
  voted_date
) VALUES (
  :user_id!,
  :prediction_id!,
  :vote!,
  NOW()
)
ON CONFLICT (user_id, prediction_id)
  DO UPDATE SET vote = :vote!
RETURNING id, user_id, prediction_id, vote, voted_date;