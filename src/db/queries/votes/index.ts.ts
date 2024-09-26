import { PoolClient } from "pg";
import { APIVotes } from "../../../types/votes";
import queries from "../index";

const add =
  (client: PoolClient) =>
  (
    user_id: string,
    prediction_id: number | string,
    vote: boolean
  ): Promise<APIVotes.AddVote> => {
    return client
      .query<APIVotes.AddVote>(queries.get("AddVote"), [
        user_id,
        prediction_id,
        vote,
      ])
      .then((response) => response.rows[0]);
  };

const deleteVotesByPredictionId =
  (client: PoolClient) =>
  (
    prediction_id: number | string
  ): Promise<APIVotes.DeleteVotesByPredictionId> => {
    return client
      .query<APIVotes.DeleteVotesByPredictionId>(
        queries.get("DeleteVotesByPredictionId"),
        [prediction_id]
      )
      .then((response) => response.rows[0]);
  };

export default {
  add,
  deleteVotesByPredictionId,
};
