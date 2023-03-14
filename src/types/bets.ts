export namespace APIBets {
  export type Bet = {
    id: number;
    user_id: string;
    prediction_id: number;
    endorsed: boolean;
    date: string;
  };

  export type AddBet = Bet;
}
