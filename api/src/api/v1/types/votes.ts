export namespace APIVotes {
  export type Vote = {
    id: number;
    user_id: string;
    prediction_id: number;
    vote: boolean;
    voted_date: string;
  };

  export type AddVote = Vote;

  export type DeleteVotesByPredictionId = null;
}
