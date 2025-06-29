/** Types generated for queries found in "src/v2/queries/snooze_checks/snooze_checks.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetSnoozeChecksByPredictionId' parameters type */
export interface IGetSnoozeChecksByPredictionIdParams {
  prediction_id: number;
}

/** 'GetSnoozeChecksByPredictionId' return type */
export interface IGetSnoozeChecksByPredictionIdResult {
  check_date: Date;
  closed: boolean;
  closed_at: Date | null;
  id: number;
  prediction_id: number | null;
  votes_day: string;
  votes_month: string;
  votes_quarter: string;
  votes_week: string;
  votes_year: string;
}

/** 'GetSnoozeChecksByPredictionId' query type */
export interface IGetSnoozeChecksByPredictionIdQuery {
  params: IGetSnoozeChecksByPredictionIdParams;
  result: IGetSnoozeChecksByPredictionIdResult;
}

const getSnoozeChecksByPredictionIdIR: any = {"usedParamSet":{"prediction_id":true},"params":[{"name":"prediction_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":486,"b":500}]}],"statement":"SELECT\n  sc.id,\n  sc.prediction_id,\n  sc.check_date,\n  sc.closed,\n  sc.closed_at,\n  COUNT(sv.*) FILTER (WHERE sv.value = 1) as \"votes_day!\",\n  COUNT(sv.*) FILTER (WHERE sv.value = 7) as \"votes_week!\",\n  COUNT(sv.*) FILTER (WHERE sv.value = 30) as \"votes_month!\",\n  COUNT(sv.*) FILTER (WHERE sv.value = 90) as \"votes_quarter!\",\n  COUNT(sv.*) FILTER (WHERE sv.value = 365) as \"votes_year!\"\nFROM snooze_checks sc\nJOIN snooze_votes sv ON sv.snooze_check_id = sc.id\nWHERE sc.prediction_id = :prediction_id!\nGROUP BY sc.id\nORDER BY sc.check_date DESC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *   sc.id,
 *   sc.prediction_id,
 *   sc.check_date,
 *   sc.closed,
 *   sc.closed_at,
 *   COUNT(sv.*) FILTER (WHERE sv.value = 1) as "votes_day!",
 *   COUNT(sv.*) FILTER (WHERE sv.value = 7) as "votes_week!",
 *   COUNT(sv.*) FILTER (WHERE sv.value = 30) as "votes_month!",
 *   COUNT(sv.*) FILTER (WHERE sv.value = 90) as "votes_quarter!",
 *   COUNT(sv.*) FILTER (WHERE sv.value = 365) as "votes_year!"
 * FROM snooze_checks sc
 * JOIN snooze_votes sv ON sv.snooze_check_id = sc.id
 * WHERE sc.prediction_id = :prediction_id!
 * GROUP BY sc.id
 * ORDER BY sc.check_date DESC
 * ```
 */
export const getSnoozeChecksByPredictionId = new PreparedQuery<IGetSnoozeChecksByPredictionIdParams,IGetSnoozeChecksByPredictionIdResult>(getSnoozeChecksByPredictionIdIR);


