import { renderToStream } from "@kitajs/html/suspense";
import { Router } from "express";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../../middleware/auth/session";
import { getColorScheme, getThemePreference } from "../../../middleware/theme-preference";
import { requireWebAuth } from "../../../middleware/auth/require-auth";
import { wrapWebRouteWithErrorBoundary } from "../../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../../shared/components/page-layout";
import { clientScriptsForModule } from "../../../shared/clientScriptsForModule";
import { SuspenseDemoPage } from "./page";

/** Registers `GET /demo/suspense` (Suspense streaming demo). */
export const SuspenseDemo: Route = (router: Router) => {
  router.get(
    "/demo/suspense",
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Suspense demo route reached without a session (requireWebAuth bug)"));
        return;
      }
      const theme = getThemePreference();
      const colorScheme = getColorScheme();
      const stream = renderToStream((rid) => (
        <AuthenticatedPageLayout
          theme={theme}
          colorScheme={colorScheme}
          title="Suspense streaming (Kita Html)"
          auth={auth}
          clientScripts={clientScriptsForModule(__filename)}
          preferencesReturnTo={req.originalUrl.split("#")[0] || "/"}
        >
          <SuspenseDemoPage rid={rid} />
        </AuthenticatedPageLayout>
      ));
      res.type("html");
      stream.pipe(res);
    }),
  );
};
