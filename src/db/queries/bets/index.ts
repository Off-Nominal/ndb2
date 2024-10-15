import { IDatabaseConnection } from "@pgtyped/runtime/lib/tag";
import { addBet, getBetsByUserId, IAddBetParams } from "./bets.queries";

const add = (
  params: Omit<IAddBetParams, "date"> & {
    date?: Date | string;
  },
  dbConnection: IDatabaseConnection
) => {
  // fallback date
  const date = params.date ?? new Date();

  return addBet.run({ ...params, date }, dbConnection);
};

export const bets = {
  getAllByUserId: getBetsByUserId.run,
  add,
};
