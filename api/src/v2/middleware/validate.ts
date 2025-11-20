import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import responseUtils from "../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";

/**
 * Handle Zod validation errors and convert them to error response format
 * Supports validation errors for params, query, and body
 *
 * @param errors - Array of Zod validation errors
 * @returns Array of ErrorInfo objects (empty array if no validation errors found)
 *
 * @example
 * // For a route with params, query, and body validation:
 * const validator = validate({
 *   handler: (errors, req, res, next) => {
 *     const errorInfos = responseUtils.handleValidationErrors(errors);
 *     if (errorInfos.length > 0) {
 *       res.status(400).json(responseUtils.writeErrors(errorInfos));
 *     } else {
 *       res.status(500).json(responseUtils.writeErrors([{
 *         code: API.Errors.SERVER_ERROR,
 *         message: "There was an error processing your request."
 *       }]));
 *     }
 *   },
 *   params: z.object({ id: z.string() }),        // Uses MALFORMED_URL_PARAMS (90006)
 *   query: z.object({ limit: z.number().optional() }), // Uses MALFORMED_QUERY_PARAMS (90004)
 *   body: z.object({ name: z.string(), email: z.string().email() }) // Uses MALFORMED_BODY_DATA (90003)
 * });
 */
function handleValidationErrors(
  type: "query" | "params" | "body",
  errors: z.ZodError["issues"]
): API.Utils.ErrorInfo[] {
  const errorInfos: API.Utils.ErrorInfo[] = [];

  const errorMap = {
    params: API.Errors.MALFORMED_URL_PARAMS,
    query: API.Errors.MALFORMED_QUERY_PARAMS,
    body: API.Errors.MALFORMED_BODY_DATA,
  };

  errors.forEach((issue) => {
    errorInfos.push({
      code: errorMap[type],
      message: issue.message,
    });
  });

  return errorInfos;
}

export const validate = <
  SParams extends z.ZodObject<z.ZodRawShape> | undefined,
  SQuery extends z.ZodObject<z.ZodRawShape> | undefined,
  SBody extends z.ZodTypeAny | undefined,
  TParams extends z.infer<
    SParams extends z.ZodObject<z.ZodRawShape> ? SParams : any
  >,
  TQuery extends z.infer<
    SQuery extends z.ZodObject<z.ZodRawShape> ? SQuery : any
  >,
  TBody extends z.infer<SBody extends z.ZodTypeAny ? SBody : any>
>(schema: {
  params?: SParams;
  query?: SQuery;
  body?: SBody;
}) => {
  return (
    req: Request<TParams, any, TBody, TQuery, any>,
    res: Response,
    next: NextFunction
  ) => {
    const errors: API.Utils.ErrorInfo[] = [];

    try {
      schema.params?.parse(req.params);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs = handleValidationErrors("params", err.issues);

        errors.push(...errs);
      }
    }

    try {
      schema.query?.parse(req.query);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs = handleValidationErrors("query", err.issues);
        errors.push(...errs);
      }
    }

    try {
      schema.body?.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs = handleValidationErrors("body", err.issues);
        errors.push(...errs);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json(responseUtils.writeErrors(errors));
    }

    next();
  };
};
