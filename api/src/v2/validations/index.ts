import { z } from "zod";
import { POSTGRES_MAX_INT } from "./constants";

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

/**
 * Interprets query-string booleans: `"true"` → `true`, `"false"` → `false`.
 * Pair with {@link queryParamScalar} for Express `req.query`, and `.optional()` when the param may be omitted.
 */
export const booleanStringSchema = z
  .enum(["true", "false"], {
    message: "Value must be 'true' or 'false'",
  })
  .transform((v): boolean => v === "true");

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

/**
 * Creates a Zod schema for Postgres INT values: positive integer ≤ {@link POSTGRES_MAX_INT}.
 * Use `.optional()` on the returned schema when the param may be omitted.
 *
 * @param fieldName - Used in validation messages
 */
export function createPostgresIntSchema(fieldName: string) {
  return z
    .any()
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === "") {
        ctx.addIssue({
          code: "custom",
          message: `Property '${fieldName}' is required`,
        });
        return z.NEVER;
      }
      return value;
    })
    .pipe(
      z.coerce
        .number({
          message: `Property '${fieldName}' must be a number`,
        })
        .positive({
          message: `Property '${fieldName}' must be a positive number`,
        })
        .int({
          message: `Property '${fieldName}' must be an integer`,
        })
        .lte(POSTGRES_MAX_INT, {
          message: `Property '${fieldName}' must be less than or equal to ${POSTGRES_MAX_INT}`,
        }),
    );
}

/**
 * Schema for validating prediction IDs.
 * Extends the base Postgres INT schema with prediction-specific error messages.
 */
export const predictionIdSchema = createPostgresIntSchema("prediction_id");

/** Postgres INT for season ids; pair with `.optional()` when the query param is not required. */
export const seasonIdSchema = createPostgresIntSchema("season_id");
