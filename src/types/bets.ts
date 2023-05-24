export namespace APIBets {
  export type Bet = {
    id: number;
    user_id: string;
    prediction_id: number;
    endorsed: boolean;
    date: string;
    valid: boolean;
    payout: number;
  };

  export type AddBet = Bet;
}
