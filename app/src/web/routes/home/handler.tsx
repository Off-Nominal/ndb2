import { Router } from "express";
import { Route } from "@shared/routerMap";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { PageLayout } from "../../shared/components/page_layout";
import { clientScriptsForModule } from "../../shared/clientScriptsForModule";
import { LuckyNumber } from "./components/lucky_number";
import { HomePage } from "./page";

/** Registers `/` and HTMX-targeted `GET /home/lucky-number`. */
export const Home: Route = (router: Router) => {
  router.get(
    "/",
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Home route reached without a session (requireWebAuth bug)"));
        return;
      }
      const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });
      const html = await Promise.resolve(
        <PageLayout
          theme={getThemePreference()}
          title="NDB2"
          clientScripts={clientScriptsForModule(__filename)}
          csrfMetaToken={auth.csrfToken}
          hxHeaders={csrfHeadersJson}
        >
          <HomePage message="welcome to the new ndb2 portal" auth={auth} />
        </PageLayout>,
      );
      res.type("html").send(html);
    }),
  );

  router.get(
    "/home/lucky-number",
    requireWebAuth,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const value = Math.floor(Math.random() * 1_000_000);
      const html = await Promise.resolve(<LuckyNumber value={value} />);
      res.type("html").send(html);
    }),
  );
};
