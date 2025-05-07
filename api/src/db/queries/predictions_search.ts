import { PredictionLifeCycle } from "../../types/predicitions";

export enum SortByOption {
  CREATED_ASC = "created_date-asc",
  CREATED_DESC = "created_date-desc",
  DUE_ASC = "due_date-asc",
  DUE_DESC = "due_date-desc",
  CHECK_ASC = "check_date-asc",
  CHECK_DESC = "check_date-desc",
  RETIRED_ASC = "retired_date-asc",
  RETIRED_DESC = "retired_date-desc",
  TRIGGERED_ASC = "triggered_date-asc",
  TRIGGERED_DESC = "triggered_date-desc",
  CLOSED_ASC = "closed_date-asc",
  CLOSED_DESC = "closed_date-desc",
  JUDGED_ASC = "judged_date-asc",
  JUDGED_DESC = "judged_date-desc",
}

export type SearchOptions = {
  keyword?: string;
  page?: number;
  statuses?: PredictionLifeCycle[];
  sort_by?: SortByOption[];
  predictor_id?: string;
  non_better_id?: string;
  season_id?: string;
  include_non_applicable?: boolean;
};

const sortByOptions = {
  [SortByOption.CREATED_ASC]: `p.created_date ASC`,
  [SortByOption.CREATED_DESC]: `p.created_date DESC`,
  [SortByOption.DUE_ASC]: `p.due_date ASC NULLS LAST`,
  [SortByOption.DUE_DESC]: `p.due_date DESC NULLS LAST`,
  [SortByOption.CHECK_ASC]: `p.check_date ASC NULLS LAST`,
  [SortByOption.CHECK_DESC]: `p.check_date DESC NULLS LAST`,
  [SortByOption.RETIRED_ASC]: `p.retired_date ASC NULLS LAST`,
  [SortByOption.RETIRED_DESC]: `p.retired_date DESC NULLS LAST`,
  [SortByOption.TRIGGERED_ASC]: `p.triggered_date AS NULLS LAST`,
  [SortByOption.TRIGGERED_DESC]: `p.triggered_date DESC NULLS LAST`,
  [SortByOption.CLOSED_ASC]: `p.closed_date ASC NULLS LAST`,
  [SortByOption.CLOSED_DESC]: `p.closed_date DESC NULLS LAST`,
  [SortByOption.JUDGED_ASC]: `p.judged_date ASC NULLS LAST`,
  [SortByOption.JUDGED_DESC]: `p.judged_date DESC NULLS LAST`,
};

export const generate_SEARCH_PREDICTIONS = (
  options: SearchOptions
): [string, string[]] => {
  const params: string[] = [];

  const hasWhereClause =
    (options.statuses && options.statuses.length > 0) ||
    options.predictor_id ||
    options.non_better_id ||
    options.season_id;

  let whereClause = hasWhereClause ? "WHERE " : "";

  const whereClauses = [];

  // Add Status filters
  // Multiple statuses are joined via OR
  if (options.statuses && options.statuses.length > 0) {
    const statusClauses = options.statuses
      .map((status) => {
        params.push(status);
        return `p.status = $${params.length}`;
      })
      .join(" OR ");
    whereClauses.push(`(${statusClauses})`);
  }

  // Add predictor filter
  if (options.predictor_id) {
    params.push(options.predictor_id);
    whereClauses.push(`p.user_id = $${params.length}`);
  }

  // Add non better filter
  if (options.non_better_id) {
    params.push(options.non_better_id);
    whereClauses.push(
      `NOT EXISTS (SELECT 1 FROM bets WHERE bets.prediction_id = p.id AND bets.user_id = $${params.length})`
    );
  }

  // Add season filter
  if (options.season_id) {
    params.push(options.season_id);
    whereClauses.push(`p.season_id = $${params.length}`);

    if (!options.include_non_applicable) {
      whereClauses.push(`p.season_applicable IS TRUE`);
    }
  }

  // merge all the where clauses together
  whereClause += whereClauses.join(" AND ");

  // set up ORDER BY clauses
  let orderByClause = `ORDER BY `;

  const orderByClauses = [];

  // If there is a keyword, sort by that first, since it uses
  // trigrams and ranks matche
  // If the keyword is present, any other sorts will not accomplish
  // much, but they are left on anyway
  if (options.keyword) {
    params.push(options.keyword);
    orderByClauses.push(`p.text <-> $${params.length}`);
  }

  // multiple sort by is supported, ranked in order of the query string
  if (options.sort_by) {
    options.sort_by.forEach((opt) => {
      orderByClauses.push(sortByOptions[opt]);
    });
  }

  orderByClauses.push(`p.id ASC`);

  // merge ORDER BY clauses together
  orderByClause += orderByClauses.join(", ");

  // OFFSET/PAGE
  const page = options.page || 1;
  params.push((page - 1).toString());
  const offset = `OFFSET ($${params.length}) * 10`;

  return [
    `
    SELECT
      p.id,
      (SELECT row_to_json(pred) FROM 
          (SELECT 
              p.user_id as id, 
              u.discord_id 
            FROM users u 
            WHERE u.id = p.user_id) 
        pred)
      as predictor,
      p.text,
      p.driver,
      p.season_id,
      p.season_applicable,
      p.created_date,
      p.due_date,
      p.check_date,
      p.last_check_date,
      p.closed_date,
      p.triggered_date,
      (SELECT row_to_json(trig) FROM 
          (SELECT 
              p.triggerer_id as id, 
              u.discord_id 
            FROM users u 
            WHERE u.id = p.triggerer_id) 
        trig)
      as triggerer,
      p.judged_date,
      p.retired_date,
      p.status,
      (SELECT row_to_json(bs) FROM
          (SELECT
            COUNT(b.id) FILTER (WHERE b.endorsed IS TRUE AND b.valid IS TRUE) as endorsements,
            COUNT(b.id) FILTER (WHERE b.endorsed IS FALSE AND b.valid IS TRUE) as undorsements,
            COUNT(b.id) FILTER (WHERE b.valid IS FALSE) as invalid
            FROM bets b
            WHERE b.prediction_id = p.id
          ) bs
      ) as bets,
      (SELECT row_to_json(vs) FROM
          (SELECT
            COUNT(v.id) FILTER (WHERE v.vote IS TRUE) as yes,
            COUNT(v.id) FILTER (WHERE v.vote IS FALSE) as no
            FROM votes v
            WHERE v.prediction_id = p.id
          ) vs
      ) as votes,
      (SELECT row_to_json(payout_sum)
        FROM(
          SELECT p.endorse_ratio as endorse, p.undorse_ratio as undorse
        ) payout_sum
      ) as payouts
    FROM predictions p
    ${whereClause}
    ${orderByClause}
    LIMIT 10
    ${offset}`,
    params,
  ];
};
