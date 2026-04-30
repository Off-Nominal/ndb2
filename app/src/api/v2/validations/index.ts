import { z } from "zod";
import { Entities } from "@offnominal/ndb2-api-types/v2";
import { POSTGRES_MAX_INT } from "./constants";

const [
  snoozeVoteDay,
  snoozeVoteWeek,
  snoozeVoteMonth,
  snoozeVoteQuarter,
  snoozeVoteYear,
] = Entities.SnoozeVotes.SNOOZE_VOTE_VALUES;

/**
 * POST body `value` for snooze votes. Infers as {@link Entities.SnoozeVotes.SnoozeVoteValue}.
 */
export const snoozeVoteValueSchema = z.coerce
  .number({
    message: "Property 'value' must be a number",
  })
  .pipe(
    z.union(
      [
        z.literal(snoozeVoteDay),
        z.literal(snoozeVoteWeek),
        z.literal(snoozeVoteMonth),
        z.literal(snoozeVoteQuarter),
        z.literal(snoozeVoteYear),
      ],
      {
        message:
          "Property 'value' must be one of: 1, 7, 30, 90, 365 (snooze duration in days).",
      },
    ),
  );

/**
 * Normalizes raw Express `req.query` values for a single logical parameter:
 * `undefined`, `null`, and `""` become `undefined`; arrays use the first element
 * (repeated keys in the query string); other values pass through unchanged.
 */
export function preprocessQueryStringScalar(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Wraps a Zod schema so it receives the result of {@link preprocessQueryStringScalar}.
 */
export function queryParamScalar<Schema extends z.ZodTypeAny>(schema: Schema) {
  return z.preprocess(preprocessQueryStringScalar, schema);
}

/**
 * Normalizes raw query values that may be repeated: `undefined` / `null` / `""`
 * become `undefined`; a single string becomes a one-element array; string arrays pass through.
 */
export function preprocessQueryStringMulti(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Wraps a Zod schema so it receives the result of {@link preprocessQueryStringMulti}.
 */
export function queryParamMulti<Schema extends z.ZodTypeAny>(schema: Schema) {
  return z.preprocess(preprocessQueryStringMulti, schema);
}

/**
 * Optional string that trims; `undefined`, `""`, or whitespace-only after trim becomes `undefined`.
 * Use with {@link queryParamScalar} so blank query params behave as omitted.
 */
export const optionalTrimmedStringSchema = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined) return undefined;
    const t = s.trim();
    return t === "" ? undefined : t;
  });

export type BooleanStringSchemaOptions = {
  /** Property name in validation messages (`Property '…'`). */
  propName: string;
  /**
   * When set, native JSON booleans are accepted in addition to `"true"` / `"false"` strings.
   * Use for `express.json()` bodies; omit for query params (strings only).
   */
  allowJsonBoolean?: boolean;
};

/**
 * Creates a Zod schema for booleans from `"true"` / `"false"` strings (e.g. query params).
 * Pair with {@link queryParamScalar} for Express `req.query`, and `.optional()` on the returned schema when the param may be omitted.
 */
export function createBooleanStringSchema(options: BooleanStringSchemaOptions) {
  return z
    .enum(["true", "false"], {
      message: `Property '${options.propName}' must be 'true' or 'false'`,
    })
    .transform((v): boolean => v === "true");
}

export const predictionDriverSchema = z.enum(["event", "date"], {
  message: "Property 'driver' must be either 'event' or 'date'",
});

/**
 * Schema for validating Discord IDs.
 * Validates that a value is a non-empty string that is at least 17 characters long and a numeric string.
 */
export const discordIdSchema = z
  .string({
    message: "Property 'discord_id' must be a string",
  })
  .min(17, "Property 'discord_id' must be at least 17 characters")
  .regex(/^[0-9]+$/, "Property 'discord_id' must be a numeric string");

/** Internal `users.id` (UUID) for handlers that already resolved a Discord id. */
export const userIdUuidSchema = z.uuid({
  error: "Property 'user_id' must be a valid UUID",
});

const SEASON_RESULTS_LEADERBOARD_SORT_VALUES = [
  "points_net-desc",
  "points_net-asc",
  "predictions_successful-desc",
  "predictions_successful-asc",
  "bets_successful-desc",
  "bets_successful-asc",
] as const;

const USER_SEASON_RESULTS_LIST_SORT_VALUES = [
  "season_end-desc",
  "season_end-asc",
] as const;

const resultsPerPageCoerce = z.coerce
  .number()
  .int()
  .positive()
  .max(100, "Property 'per_page' must be at most 100");

const resultsPageCoerce = z.coerce.number().int().positive();

/** GET /seasons/:id/results */
export const seasonResultsLeaderboardQuerySchema = z.object({
  sort_by: queryParamScalar(
    z
      .enum(SEASON_RESULTS_LEADERBOARD_SORT_VALUES)
      .optional()
      .default("points_net-desc"),
  ),
  page: queryParamScalar(resultsPageCoerce.optional().default(1)),
  per_page: queryParamScalar(
    resultsPerPageCoerce.optional().default(25),
  ),
});

/** GET /users/discord_id/:discord_id/results */
export const userSeasonResultsListQuerySchema = z.object({
  sort_by: queryParamScalar(
    z
      .enum(USER_SEASON_RESULTS_LIST_SORT_VALUES)
      .optional()
      .default("season_end-desc"),
  ),
  page: queryParamScalar(resultsPageCoerce.optional().default(1)),
  per_page: queryParamScalar(
    resultsPerPageCoerce.optional().default(25),
  ),
});

/**
 * Schema for validating future dates.
 * Validates that a value is a non-empty date that is in the future.
 */
export const createFutureDateSchema = ({ fieldName }: { fieldName: string }) =>
  z
    .any()
    .refine((val) => val !== undefined && val !== null && val !== "", {
      message: `${fieldName} is required`,
    })
    .pipe(
      z.iso
        .datetime({
          message: `Property '${fieldName}' must be a valid ISO 8601 datetime string`,
        })
        .transform((s) => new Date(s))
        .refine((d: Date) => d.getTime() > Date.now(), {
          message: `Property '${fieldName}' must be in the future`,
        }),
    );

export type PostgresIntSchemaOptions = {
  /** Property name in validation messages (`Property '…'`). */
  propName: string;
};

/**
 * Creates a Zod schema for Postgres INT values: positive integer ≤ {@link POSTGRES_MAX_INT}.
 * Use `.optional()` on the returned schema when the param may be omitted.
 */
export function createPostgresIntSchema(options: PostgresIntSchemaOptions) {
  const { propName } = options;
  return z
    .any()
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === "") {
        ctx.addIssue({
          code: "custom",
          message: `Property '${propName}' is required`,
        });
        return z.NEVER;
      }
      return value;
    })
    .pipe(
      z.coerce
        .number({
          message: `Property '${propName}' must be a number`,
        })
        .positive({
          message: `Property '${propName}' must be a positive number`,
        })
        .int({
          message: `Property '${propName}' must be an integer`,
        })
        .lte(POSTGRES_MAX_INT, {
          message: `Property '${propName}' must be less than or equal to ${POSTGRES_MAX_INT}`,
        }),
    );
}

/**
 * Schema for validating prediction IDs.
 * Extends the base Postgres INT schema with prediction-specific error messages.
 */
export const predictionIdSchema = createPostgresIntSchema({
  propName: "prediction_id",
});

export const snoozeCheckIdSchema = createPostgresIntSchema({
  propName: "snooze_check_id",
});

/** Postgres INT for season ids; pair with `.optional()` when the query param is not required. */
export const seasonIdSchema = createPostgresIntSchema({
  propName: "season_id",
});

/**
 * GET /seasons/:id — numeric season id or identifier `current` | `past` | `future`.
 */
export const seasonLookupParamSchema = z.union([
  z.enum(["current", "past", "future"]).transform(
    (
      identifier,
    ): {
      kind: "identifier";
      identifier: Entities.Seasons.Identifier;
    } => ({
      kind: "identifier",
      identifier,
    }),
  ),
  createPostgresIntSchema({ propName: "id" }).transform((id) => ({
    kind: "id" as const,
    id,
  })),
]);
