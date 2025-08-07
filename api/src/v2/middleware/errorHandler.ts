import { Request, Response, NextFunction } from "express";
import { createLogger } from "../../utils";
import responseUtils from "../utils/response";
import * as API from "@offnominal/ndb2-api-types/v2";

const logger = createLogger("ErrorHandler");

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
  next: NextFunction
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
    ])
  );
};
