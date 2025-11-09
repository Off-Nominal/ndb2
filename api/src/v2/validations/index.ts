import { z } from "zod";
import { POSTGRES_MAX_INT } from "./constants";

export const predictionIdSchema = z
  .any()
  .transform((value, ctx) => {
    if (value === undefined || value === null || value === "") {
      ctx.addIssue({
        code: "custom",
        message: "Prediction ID is required",
      });
      return z.NEVER;
    }

    return value;
  })
  .pipe(
    z.coerce
      .number({
        error: "Prediction ID must be a number",
      })
      .positive({
        message: "Prediction ID must be a positive number",
      })
      .int({
        message: "Prediction ID must be an integer",
      })
      .lte(POSTGRES_MAX_INT, {
        message: `Prediction ID must be less than or equal to ${POSTGRES_MAX_INT}`,
      })
  );
