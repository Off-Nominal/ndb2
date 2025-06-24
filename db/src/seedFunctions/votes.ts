import { VoteSeed } from "../types";
import { resolveSeedDate } from "../utils/dateUtils";

export const INSERT_VOTES_BULK_SQL = `
  INSERT INTO votes (
    user_id, 
    prediction_id, 
    vote, 
    voted_date
  ) 
  SELECT * FROM UNNEST(
    $1::uuid[],
    $2::integer[],
    $3::boolean[],
    $4::timestamp[]
  )
`;

export interface VoteInsertData {
  user_id: string;
  prediction_id: number;
  vote: boolean;
  voted_date: Date;
}

export function createVotesBulkInsertData(
  voteSeeds: VoteSeed[],
  predictionIds: number[],
  baseDate: Date
): {
  user_ids: string[];
  prediction_ids: number[];
  votes: boolean[];
  voted_dates: Date[];
} {
  return {
    user_ids: voteSeeds.map((vote) => vote.user_id),
    prediction_ids: predictionIds,
    votes: voteSeeds.map((vote) => vote.vote),
    voted_dates: voteSeeds.map((vote) => resolveSeedDate(vote.voted, baseDate)),
  };
}

export function insertVotesBulk(
  client: any,
  voteSeeds: VoteSeed[],
  predictionIds: number[],
  baseDate: Date
) {
  const bulkData = createVotesBulkInsertData(
    voteSeeds,
    predictionIds,
    baseDate
  );
  return client.query(INSERT_VOTES_BULK_SQL, [
    bulkData.user_ids,
    bulkData.prediction_ids,
    bulkData.votes,
    bulkData.voted_dates,
  ]);
}
