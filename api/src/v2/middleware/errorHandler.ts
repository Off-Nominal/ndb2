import { Request, Response, NextFunction, RequestHandler } from "express";
import responseUtils from "../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";
import { createLogger } from "@mendahu/utilities";

const logger = createLogger({
  namespace: "ErrorHandler",
  env: ["dev", "production"],
});

/**
 * Express error handling middleware that catches any unhandled errors
 * and returns a consistent 500 error response.
 *
 * This should be added as the last middleware in your router chain.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log error with metadata
  logger.error("Unhandled Server Error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  return res.status(500).json(
    responseUtils.writeErrors([
      {
        code: API.Errors.SERVER_ERROR,
        message: "There was an error processing your request.",
      },
    ]),
  );
};

// Wraps a route with a try/catch block and calls next(error) if an error is thrown
// Useful for async routes that throw errors
export const wrapRouteWithErrorBoundary = <
  TParams,
  T extends any,
  TBody,
  TQuery,
  R extends Record<string, any>,
>(
  handler: RequestHandler<TParams, T, TBody, TQuery, R>,
): RequestHandler<TParams, T, TBody, TQuery, R> => {
  return async (req, res, next) => {
    try {
      return await handler(req, res, next);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };
};
