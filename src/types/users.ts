export namespace APIUsers {
  export type GetUserScoreByDiscordId = {
    season?: {
      id: number;
      name: string;
      start: string;
      end: string;
    };
    score: {
      points: number;
      rank: number;
    };
    predictions: {
      successful: number;
      failed: number;
      pending: number;
      retired: number;
      rank: number;
    };
    bets: {
      successful: number;
      failed: number;
      pending: number;
      retired: number;
      rank: number;
    };
    votes: {
      sycophantic: number;
      contrarian: number;
      pending: number;
    };
  };
}
