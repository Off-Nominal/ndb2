import { z } from "zod";
import { POSTGRES_MAX_INT } from "./constants";

export const predictionIdSchema = z.coerce
  .number({
    required_error: "Prediction ID is required",
    invalid_type_error: "Prediction ID must be a number",
  })
  .positive({
    message: "Prediction ID must be a positive number",
  })
  .int({
    message: "Prediction ID must be an integer",
  })
  .lte(POSTGRES_MAX_INT, {
    message: `Prediction ID must be less than or equal to ${POSTGRES_MAX_INT}`,
  });
