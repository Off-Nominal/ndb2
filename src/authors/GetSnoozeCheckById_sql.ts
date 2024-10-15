import { Sql } from "postgres";

export const getSnoozeCheckByIdQuery = `-- name: GetSnoozeCheckById :one
SELECT 
  id, 
  prediction_id, 
  check_date, 
  closed, 
  closed_at,
  (SELECT row_to_json(vals)
    FROM(
      SELECT
        COUNT(sv.*) FILTER (WHERE sv.value = 1) as day,
        COUNT(sv.*) FILTER (WHERE sv.value = 7) as week,
        COUNT(sv.*) FILTER (WHERE sv.value = 30) as month,
        COUNT(sv.*) FILTER (WHERE sv.value = 90) as quarter,
        COUNT(sv.*) FILTER (WHERE sv.value = 365) as year
      FROM snooze_votes sv
      WHERE sv.snooze_check_id = $1
    ) vals
  ) as votes
FROM snooze_checks
WHERE id = $1`;

export interface GetSnoozeCheckByIdArgs {
    snoozeCheckId: number;
}

export interface GetSnoozeCheckByIdRow {
    id: number;
    predictionId: number | null;
    checkDate: Date;
    closed: boolean;
    closedAt: Date | null;
    votes: any;
}

export async function getSnoozeCheckById(sql: Sql, args: GetSnoozeCheckByIdArgs): Promise<GetSnoozeCheckByIdRow | null> {
    const rows = await sql.unsafe(getSnoozeCheckByIdQuery, [args.snoozeCheckId]).values();
    if (rows.length !== 1) {
        return null;
    }
    const row = rows[0];
    return {
        id: row[0],
        predictionId: row[1],
        checkDate: row[2],
        closed: row[3],
        closedAt: row[4],
        votes: row[5]
    };
}

