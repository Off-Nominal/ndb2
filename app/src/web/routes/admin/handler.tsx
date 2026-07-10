import type { Request } from "express";
import type * as API from "@offnominal/ndb2-api-types/v2";
import { getDbClient } from "@data/db/getDbClient";
import { resendSeasonEndWebhook } from "@domain/seasons/resend-season-end-webhook";
import { getDiscordGatewayStatus } from "@domain/discord";
import { Router } from "express";
import { Route } from "@shared/routerMap";
import { resolveAuthenticatedShell } from "../../auth/resolve-authenticated-shell";
import { assertWebCsrf } from "../../middleware/auth/assert-web-csrf";
import { getWebAuth } from "../../middleware/auth/session";
import type { WebAuthAuthenticated } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { requireWebAdmin } from "../../middleware/auth/require-web-admin";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import { ErrorHtmxSnippet } from "../../shared/components/error-page";
import { documentTitle } from "@web/shared/utils/document_title";
import { loadEligiblePastClosedSeasons } from "./load-eligible-past-closed-seasons";
import { parseSeasonEndEventForm } from "./parse-season-end-event-form";
import { AdminPage, type AdminPageBanner, type AdminPageProps } from "./page";
import { SeasonEndWebhookSuccessSnippet } from "./components/season-end-webhook-feedback";

function defaultSelectedSeasonId(
  seasons: API.Entities.Seasons.Season[],
): string {
  return seasons[0] != null ? String(seasons[0].id) : "";
}

async function renderAdminDocument(
  auth: WebAuthAuthenticated,
  pageProps: AdminPageProps,
): Promise<JSX.Element> {
  const { discordProfile, showAdminNav } = await resolveAuthenticatedShell(auth);
  const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });

  return (
    <AuthenticatedPageLayout
      theme={getThemePreference()}
      colorScheme={getColorScheme()}
      title={documentTitle("Admin")}
      auth={auth}
      discordProfile={discordProfile}
      showAdminNav={showAdminNav}
      discordGatewayStatus={getDiscordGatewayStatus()}
      csrfMetaToken={auth.csrfToken}
      hxHeaders={csrfHeadersJson}
    >
      <AdminPage {...pageProps} />
    </AuthenticatedPageLayout>
  );
}

function isHtmxRequest(req: Request): boolean {
  return req.get("HX-Request") === "true";
}

/** Registers **`GET /admin`** and **`POST /admin/season-end-event`**. */
export const Admin: Route = (router: Router) => {
  router.get(
    "/admin",
    requireWebAuth,
    requireWebAdmin,
    wrapWebRouteWithErrorBoundary(async (_req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Admin route reached without a session"));
        return;
      }

      const dbClient = await getDbClient(res);
      const seasons = await loadEligiblePastClosedSeasons(dbClient);
      const html = await Promise.resolve(
        renderAdminDocument(auth, {
          seasons,
          selectedSeasonId: defaultSelectedSeasonId(seasons),
        }),
      );

      res.type("html").send(html);
    }),
  );

  router.post(
    "/admin/season-end-event",
    requireWebAuth,
    requireWebAdmin,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Admin season-end route reached without a session"));
        return;
      }

      const isHtmx = isHtmxRequest(req);

      if (!assertWebCsrf(req, auth.csrfToken)) {
        const fragment = ErrorHtmxSnippet({
          title: "Invalid request",
          body: "Invalid CSRF token. Refresh the page and try again.",
        });
        if (isHtmx) {
          res.status(403).type("html").send(fragment);
          return;
        }
        res.status(403).type("text/plain").send("Invalid CSRF token");
        return;
      }

      const parsed = parseSeasonEndEventForm(req.body);
      if (!parsed.ok) {
        const fragment = ErrorHtmxSnippet({
          title: "Invalid season",
          body: parsed.message,
        });
        if (isHtmx) {
          res.status(400).type("html").send(fragment);
          return;
        }
        const dbClient = await getDbClient(res);
        const seasons = await loadEligiblePastClosedSeasons(dbClient);
        const html = await Promise.resolve(
          renderAdminDocument(auth, {
            seasons,
            selectedSeasonId: defaultSelectedSeasonId(seasons),
            banner: {
              kind: "error",
              title: "Invalid season",
              body: parsed.message,
            },
          }),
        );
        res.status(400).type("html").send(html);
        return;
      }

      const dbClient = await getDbClient(res);
      const result = await resendSeasonEndWebhook(dbClient, {
        season_id: parsed.data.season_id,
      });

      if (!result.ok) {
        const fragment = ErrorHtmxSnippet({
          title: "Could not re-send webhook",
          body: result.message,
        });
        if (isHtmx) {
          res.status(400).type("html").send(fragment);
          return;
        }
        const seasons = await loadEligiblePastClosedSeasons(dbClient);
        const html = await Promise.resolve(
          renderAdminDocument(auth, {
            seasons,
            selectedSeasonId: String(parsed.data.season_id),
            banner: {
              kind: "error",
              title: "Could not re-send webhook",
              body: result.message,
            },
          }),
        );
        res.status(400).type("html").send(html);
        return;
      }

      const successFragment = SeasonEndWebhookSuccessSnippet({
        seasonName: result.season_name,
      });

      if (isHtmx) {
        res.status(200).type("html").send(successFragment);
        return;
      }

      const seasons = await loadEligiblePastClosedSeasons(dbClient);
      const banner: AdminPageBanner = {
        kind: "success",
        title: "Webhook sent",
        body: `Season end webhook sent for ${result.season_name}.`,
      };
      const html = await Promise.resolve(
        renderAdminDocument(auth, {
          seasons,
          selectedSeasonId: String(result.season_id),
          banner,
        }),
      );
      res.status(200).type("html").send(html);
    }),
  );
};
