import { PoolClient } from "pg";
import { add, isAfter } from "date-fns";
import { config } from "@config";
import * as API from "@offnominal/ndb2-api-types/v2";
import predictions from "@data/queries/predictions";
import betsQueries from "@data/queries/bets";
import users from "@data/queries/users";
import type { DomainFailure } from "@domain/domain-failure";

/**
 * Subset of {@link API.Errors} this operation can return (aggregator for callers/tests).
 */
export type PlaceBetErrorCode =
  | typeof API.Errors.PREDICTION_NOT_FOUND
  | typeof API.Errors.INVALID_PREDICTION_STATUS
  | typeof API.Errors.BETS_NO_CHANGE
  | typeof API.Errors.BETS_UNCHANGEABLE;

export type PlaceBetSuccess = {
  ok: true;
  /** Lets callers choose copy and decide when to reload projection rows. */
  outcome: "created" | "changed";
};

export type PlaceBetFailure = DomainFailure<PlaceBetErrorCode>;

export type PlaceBetResult = PlaceBetSuccess | PlaceBetFailure;

export type PlaceBetInput = {
  prediction_id: number;
  discord_id: string;
  endorsed: boolean;
};

/**
 * Validates lifecycle/window rules and persists the bet.
 * Callers reload projections (e.g. full prediction) and map {@link PlaceBetFailure} to HTTP/HTML.
 */
export async function placeBet(
  dbClient: PoolClient,
  input: PlaceBetInput,
): Promise<PlaceBetResult> {
  const { prediction_id, discord_id, endorsed } = input;

  const prediction = await predictions.getById(dbClient)(prediction_id);

  if (!prediction) {
    return {
      ok: false,
      code: API.Errors.PREDICTION_NOT_FOUND,
      message: `Prediction with id ${prediction_id} does not exist.`,
    };
  }

  if (prediction.status !== "open") {
    return {
      ok: false,
      code: API.Errors.INVALID_PREDICTION_STATUS,
      message: "Bets can only be placed on open predictions.",
    };
  }

  const user = await users.getByDiscordId(dbClient)(discord_id);
  const existingBet = prediction.bets.find(
    (b) => b.better.discord_id === discord_id,
  );

  if (existingBet) {
    if (existingBet.endorsed === endorsed) {
      return {
        ok: false,
        code: API.Errors.BETS_NO_CHANGE,
        message: `You have already ${
          existingBet.endorsed ? "endorsed" : "undorsed"
        } this prediction. No change necessary.`,
      };
    }

    const now = new Date();
    const expiryWindow = add(new Date(existingBet.date), {
      hours: config.gameMechanics.predictionUpdateWindowHours,
    });

    if (isAfter(now, expiryWindow)) {
      return {
        ok: false,
        code: API.Errors.BETS_UNCHANGEABLE,
        message: `Bets cannot be changed past the allowable time window of ${config.gameMechanics.predictionUpdateWindowHours} hours since the bet was made.`,
      };
    }
  }

  await betsQueries.add(dbClient)({
    user_id: user.id,
    prediction_id,
    endorsed,
    date: new Date(),
  });

  return {
    ok: true,
    outcome: existingBet ? "changed" : "created",
  };
}
