import { z } from "zod";
import { POSTGRES_MAX_INT } from "./constants";

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
        })
    );

/**
 * Creates a schema for validating Postgres INT type values with custom field name.
 * Validates that a value is a positive integer within Postgres INT range.
 *
 * @param fieldName - The name of the field being validated (used in error messages)
 * @returns A Zod schema for Postgres INT validation
 */
function createPostgresIntSchema(fieldName: string) {
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
        })
    );
}

/**
 * Schema for validating prediction IDs.
 * Extends the base Postgres INT schema with prediction-specific error messages.
 */
export const predictionIdSchema = createPostgresIntSchema("prediction_id");
