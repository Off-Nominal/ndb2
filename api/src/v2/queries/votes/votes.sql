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