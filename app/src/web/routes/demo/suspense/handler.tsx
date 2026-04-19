import { renderToStream } from "@kitajs/html/suspense";
import { Router } from "express";
import { Route } from "@shared/routerMap";
import { getThemePreference } from "../../../middleware/theme-preference";
import { requireWebAuth } from "../../../middleware/auth/require-auth";
import { wrapWebRouteWithErrorBoundary } from "../../../middleware/error-boundary";
import { SuspenseDemoPage } from "./page";

/** Registers `GET /demo/suspense` (Suspense streaming demo). */
export const SuspenseDemo: Route = (router: Router) => {
  router.get(
    "/demo/suspense",
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res) => {
      const theme = getThemePreference();
      const stream = renderToStream((rid) => (
        <SuspenseDemoPage rid={rid} theme={theme} />
      ));
      res.type("html");
      stream.pipe(res);
    }),
  );
};
