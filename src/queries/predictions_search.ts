import { PredictionLifeCycle } from "../types/predicitions";

export enum SortByOption {
  CREATED_ASC = "created_date-asc",
  CREATED_DESC = "created_date-desc",
  DUE_ASC = "due_date-asc",
  DUE_DESC = "due_date-desc",
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
  sort_by?: SortByOption;
  predictor_id?: string;
  non_better_id?: string;
};

const sortByOptions = {
  [SortByOption.CREATED_ASC]: `p.created_date ASC`,
  [SortByOption.CREATED_DESC]: `p.created_date DESC`,
  [SortByOption.DUE_ASC]: `p.due_date ASC`,
  [SortByOption.DUE_DESC]: `p.due_date DESC`,
  [SortByOption.RETIRED_ASC]: `p.retired_date ASC`,
  [SortByOption.RETIRED_DESC]: `p.retired_date DESC`,
  [SortByOption.TRIGGERED_ASC]: `p.triggered_date ASC`,
  [SortByOption.TRIGGERED_DESC]: `p.triggered_date DESC`,
  [SortByOption.CLOSED_ASC]: `p.closed_date ASC`,
  [SortByOption.CLOSED_DESC]: `p.closed_date DESC`,
  [SortByOption.JUDGED_ASC]: `p.judged_date ASC`,
  [SortByOption.JUDGED_DESC]: `p.judged_date DESC`,
};

export const generate_SEARCH_PREDICTIONS = (options: SearchOptions) => {
  const hasWhereClause =
    options.statuses.length > 0 ||
    options.predictor_id ||
    options.non_better_id ||
    options.sort_by === SortByOption.RETIRED_ASC ||
    options.sort_by === SortByOption.RETIRED_DESC ||
    options.sort_by === SortByOption.TRIGGERED_ASC ||
    options.sort_by === SortByOption.TRIGGERED_DESC ||
    options.sort_by === SortByOption.CLOSED_ASC ||
    options.sort_by === SortByOption.CLOSED_DESC ||
    options.sort_by === SortByOption.JUDGED_ASC ||
    options.sort_by === SortByOption.JUDGED_DESC;

  let whereClause = hasWhereClause ? "WHERE " : "";

  const whereClauses = [];

  // Add Status filters
  // Multiple statuses are joined via OR
  if (options.statuses.length > 0) {
    const statusClauses = options.statuses
      .map((status) => `p.status = '${status}'`)
      .join(" OR ");
    whereClauses.push(`(${statusClauses})`);
  }

  // Any time a sort by date is added, omit any predictions which don't have that data
  switch (options.sort_by) {
    case SortByOption.RETIRED_ASC:
    case SortByOption.RETIRED_DESC: {
      whereClauses.push(`p.retired_date IS NOT NULL`);
      break;
    }
    case SortByOption.TRIGGERED_ASC:
    case SortByOption.TRIGGERED_DESC: {
      whereClauses.push(`p.triggered_date IS NOT NULL`);
      break;
    }
    case SortByOption.CLOSED_ASC:
    case SortByOption.CLOSED_DESC: {
      whereClauses.push(`p.closed_date IS NOT NULL`);
      break;
    }
    case SortByOption.JUDGED_ASC:
    case SortByOption.JUDGED_DESC: {
      whereClauses.push(`p.judged_date IS NOT NULL`);
      break;
    }
  }

  // Add predictor filter
  if (options.predictor_id) {
    whereClauses.push(`p.user_id = '${options.predictor_id}'`);
  }

  // Add non better filter
  if (options.non_better_id) {
    whereClauses.push(
      `NOT EXISTS (SELECT 1 FROM bets WHERE bets.prediction_id = p.id AND bets.user_id = '${options.non_better_id}')`
    );
  }

  // merge all the where clauses together
  whereClause += whereClauses.join(" AND ");

  // set up ORDER BY clauses
  let orderByClause = options.sort_by || options.keyword ? `ORDER BY ` : "";

  const orderByClauses = [];

  // If there is a keyword, sort by that first, since it uses
  // trigrams and ranks matche
  // If the keyword is present, any other sorts will not accomplish
  // much, but they are left on anyway
  if (options.keyword) {
    orderByClauses.push(`p.text <-> '${options.keyword}'`);
  }

  // multiple sort by is supported, ranked in order of the query string
  if (options.sort_by) {
    if (typeof options.sort_by === "string") {
      orderByClauses.push(sortByOptions[options.sort_by]);
    }

    if (Array.isArray(options.sort_by)) {
      options.sort_by.forEach((opt) => {
        orderByClauses.push(sortByOptions[opt]);
      });
    }
  }

  // merge ORDER BY clauses together
  orderByClause += orderByClauses.join(", ");

  // OFFSET/PAGE
  const page = options.page || 1;
  const offset = `OFFSET (${page - 1}) * 10`;

  return `
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
      p.created_date,
      p.due_date,
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
      (SELECT row_to_json(payout_sum)
        FROM(
          SELECT p.endorse_ratio as endorse, p.undorse_ratio as undorse
        ) payout_sum
      ) as payouts
    FROM predictions p
    ${whereClause}
    ${orderByClause}
    LIMIT 10
    ${offset}`;
};
