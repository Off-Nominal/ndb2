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
};

const sortByOptions = {
  [SortByOption.CREATED_ASC]: `ep.created_date ASC`,
  [SortByOption.CREATED_DESC]: `ep.created_date DESC`,
  [SortByOption.DUE_ASC]: `ep.due_date ASC`,
  [SortByOption.DUE_DESC]: `ep.due_date DESC`,
  [SortByOption.RETIRED_ASC]: `ep.retired_date ASC`,
  [SortByOption.RETIRED_DESC]: `ep.retired_date DESC`,
  [SortByOption.TRIGGERED_ASC]: `ep.triggered_date ASC`,
  [SortByOption.TRIGGERED_DESC]: `ep.triggered_date DESC`,
  [SortByOption.CLOSED_ASC]: `ep.closed_date ASC`,
  [SortByOption.CLOSED_DESC]: `ep.closed_date DESC`,
  [SortByOption.JUDGED_ASC]: `ep.judged_date ASC`,
  [SortByOption.JUDGED_DESC]: `ep.judged_date DESC`,
};

export const generate_SEARCH_PREDICTIONS = (options: SearchOptions) => {
  const hasWhereClause =
    options.statuses.length > 0 ||
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
      .map((status) => `ep.status = '${status}'`)
      .join(" OR ");
    whereClauses.push(`(${statusClauses})`);
  }

  // Any time a sort by date is added, omit any predictions which don't have that data
  switch (options.sort_by) {
    case SortByOption.RETIRED_ASC:
    case SortByOption.RETIRED_DESC: {
      whereClauses.push(`ep.retired_date IS NOT NULL`);
      break;
    }
    case SortByOption.TRIGGERED_ASC:
    case SortByOption.TRIGGERED_DESC: {
      whereClauses.push(`ep.triggered_date IS NOT NULL`);
      break;
    }
    case SortByOption.CLOSED_ASC:
    case SortByOption.CLOSED_DESC: {
      whereClauses.push(`ep.closed_date IS NOT NULL`);
      break;
    }
    case SortByOption.JUDGED_ASC:
    case SortByOption.JUDGED_DESC: {
      whereClauses.push(`ep.judged_date IS NOT NULL`);
      break;
    }
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
    orderByClauses.push(`ep.text <-> '${options.keyword}'`);
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
      ep.prediction_id as id,
      (SELECT row_to_json(pred) FROM 
          (SELECT 
              ep.predictor_id as id, 
              u.discord_id 
            FROM users u 
            WHERE u.id = ep.predictor_id) 
        pred)
      as predictor,
      ep.text,
      ep.created_date,
      ep.due_date,
      ep.closed_date,
      ep.triggered_date,
      (SELECT row_to_json(trig) FROM 
          (SELECT 
              ep.triggerer_id as id, 
              u.discord_id 
            FROM users u 
            WHERE u.id = ep.triggerer_id) 
        trig)
      as triggerer,
      ep.judged_date,
      ep.retired_date,
      ep.status,
      (SELECT row_to_json(payout_sum)
      FROM(
        SELECT ep.endorsement_ratio as endorse, ep.undorsement_ratio as undorse
      ) payout_sum
    ) as payouts
    FROM enhanced_predictions ep
    ${whereClause}
    ${orderByClause}
    LIMIT 10
    ${offset}`;
};
