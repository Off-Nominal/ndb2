import { z } from "zod";
import { POSTGRES_MAX_INT } from "./constants";

/**
 * Creates a schema for validating Postgres INT type values with custom field name.
 * Validates that a value is a positive integer within Postgres INT range.
 *
 * @param fieldName - The name of the field being validated (used in error messages)
 * @returns A Zod schema for Postgres INT validation
 */
function createPostgresIntSchema(fieldName: string = "Value") {
  return z
    .any()
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === "") {
        ctx.addIssue({
          code: "custom",
          message: `${fieldName} is required`,
        });
        return z.NEVER;
      }

      return value;
    })
    .pipe(
      z.coerce
        .number({
          message: `${fieldName} must be a number`,
        })
        .positive({
          message: `${fieldName} must be a positive number`,
        })
        .int({
          message: `${fieldName} must be an integer`,
        })
        .lte(POSTGRES_MAX_INT, {
          message: `${fieldName} must be less than or equal to ${POSTGRES_MAX_INT}`,
        })
    );
}

/**
 * Schema for validating prediction IDs.
 * Extends the base Postgres INT schema with prediction-specific error messages.
 */
export const predictionIdSchema = createPostgresIntSchema("Prediction ID");
