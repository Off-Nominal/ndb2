import type { ErrorRequestHandler, RequestHandler } from "express";
import { createLogger } from "@mendahu/utilities";
import { getThemePreference } from "./theme-preference";
import {
  error_htmx_snippet,
  error_page,
} from "../shared/components/error_page";

const logger = createLogger({
  namespace: "WebErrorBoundary",
  env: ["dev", "production"],
});

/**
 * Terminal middleware for the web router: logs the error and responds with HTML.
 * Register this after all web routes. Use {@link wrapWebRouteWithErrorBoundary} on
 * async handlers so rejections and thrown errors reach this handler via `next(err)`.
 */
export const webErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  logger.error("Unhandled web error", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  const theme = getThemePreference();
  const isHtmx = req.get("HX-Request") === "true";
  const errBody = "Please try again in a moment.";
  const htmlPayload = isHtmx
    ? error_htmx_snippet({
        title: "Something went wrong",
        body: errBody,
      })
    : error_page({
        theme,
        title: "Something went wrong",
        body: errBody,
      });

  void Promise.resolve(htmlPayload).then(
    (html) => {
      res.status(500).type("html").send(html);
    },
    (reason) => {
      next(reason instanceof Error ? reason : new Error(String(reason)));
    },
  );
};

/** Wraps an async route handler so failures are passed to `next(err)` (and then {@link webErrorHandler}). */
export const wrapWebRouteWithErrorBoundary = (
  handler: RequestHandler,
): RequestHandler => {
  return async (req, res, next) => {
    try {
      return await handler(req, res, next);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };
};
