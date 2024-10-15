/* 
 @name AddVote
*/
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

/*
  @name DeleteAllVotesByPredictionId
*/
DELETE FROM votes WHERE prediction_id = :prediction_id!;