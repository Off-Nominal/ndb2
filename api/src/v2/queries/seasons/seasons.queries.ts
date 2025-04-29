/** Types generated for queries found in "src/v2/queries/seasons/seasons.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetAllSeasons' parameters type */
export type IGetAllSeasonsParams = void;

/** 'GetAllSeasons' return type */
export interface IGetAllSeasonsResult {
  closed: boolean;
  end: Date;
  id: number;
  name: string;
  start: Date;
  wager_cap: number;
}

/** 'GetAllSeasons' query type */
export interface IGetAllSeasonsQuery {
  params: IGetAllSeasonsParams;
  result: IGetAllSeasonsResult;
}

const getAllSeasonsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT\n  id,\n  name,\n  start,\n  \"end\",\n  wager_cap,\n  closed\nFROM seasons\nORDER BY \"end\" DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   id,
 *   name,
 *   start,
 *   "end",
 *   wager_cap,
 *   closed
 * FROM seasons
 * ORDER BY "end" DESC
 * ```
 */
export const getAllSeasons = new PreparedQuery<IGetAllSeasonsParams,IGetAllSeasonsResult>(getAllSeasonsIR);


