import { PoolClient } from "pg";
import { APIVotes } from "../../types/votes";

const ADD_VOTE = `
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
  RETURNING id, user_id, prediction_id, vote, voted_date`;

const add =
  (client: PoolClient) =>
  (user_id: string, prediction_id: number | string, vote: boolean) => {
    return client
      .query<APIVotes.AddVote>(ADD_VOTE, [user_id, prediction_id, vote])
      .then((response) => response.rows[0]);
  };

export default {
  add,
};
