import { addVote, deleteAllVotesByPredictionId } from "./votes.queries";

export const votes = {
  add: addVote.run,
  deleteAllByPredictionId: deleteAllVotesByPredictionId.run,
};
