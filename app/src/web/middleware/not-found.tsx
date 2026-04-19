import type { RequestHandler } from "express";
import { ErrorHtmxSnippet, ErrorPage } from "../shared/components/error_page";
import { PageLayout } from "../shared/components/page_layout";
import { getThemePreference } from "./theme-preference";
import { wrapWebRouteWithErrorBoundary } from "./error-boundary";

/**
 * Runs after web routes: HTML 404 for unmatched non-API paths. Calls `next()` for `/api/*`
 * so the app's JSON API router can handle the request.
 */
export const webNotFoundMiddleware: RequestHandler = wrapWebRouteWithErrorBoundary(
  async (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    const theme = getThemePreference();
    const isHtmx = req.get("HX-Request") === "true";
    const title = "Page not found";
    const body = "There is no page at this URL.";

    const html = await Promise.resolve(
      isHtmx ? (
        ErrorHtmxSnippet({ title, body })
      ) : (
        <PageLayout theme={theme} title={title}>
          <ErrorPage title={title} body={body} />
        </PageLayout>
      ),
    );

    res.status(404).type("html").send(html);
  },
);
