import type { Request } from "express";
import type { PoolClient } from "pg";
import type * as API from "@offnominal/ndb2-api-types/v2";
import { getDbClient } from "@data/db/getDbClient";
import seasonsV2 from "@data/queries/seasons";
import { createSeason } from "./create-season";
import { proposeNextSeason } from "./propose-next-season";
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
import {
  formatDatetimeLocalUtc,
  parseAddSeasonForm,
} from "./parse-add-season-form";
import { AdminPage, type AdminPageBanner, type AdminPageProps } from "./page";
import { SeasonEndWebhookSuccessSnippet } from "./components/season-end-webhook-feedback";
import type { AddSeasonFormProps } from "./components/add-season-form";

function defaultSelectedSeasonId(
  seasons: API.Entities.Seasons.Season[],
): string {
  return seasons[0] != null ? String(seasons[0].id) : "";
}

async function loadAddSeasonFormProps(
  dbClient: PoolClient,
  overrides?: Partial<Pick<AddSeasonFormProps, "name" | "start" | "end" | "payout_formula">>,
): Promise<AddSeasonFormProps> {
  const latestSeason = await seasonsV2.getLatestForCreate(dbClient)();
  const proposal = proposeNextSeason(latestSeason);

  return {
    latestSeason,
    name: overrides?.name ?? "",
    start: overrides?.start ?? formatDatetimeLocalUtc(proposal.start),
    end: overrides?.end ?? formatDatetimeLocalUtc(proposal.end),
    payout_formula:
      overrides?.payout_formula ?? proposal.payout_formula,
  };
}

async function loadAdminPageProps(
  dbClient: PoolClient,
  options?: {
    selectedSeasonId?: string;
    banner?: AdminPageBanner;
    addSeasonOverrides?: Partial<
      Pick<AddSeasonFormProps, "name" | "start" | "end" | "payout_formula">
    >;
  },
): Promise<AdminPageProps> {
  const seasons = await loadEligiblePastClosedSeasons(dbClient);
  const addSeason = await loadAddSeasonFormProps(
    dbClient,
    options?.addSeasonOverrides,
  );

  return {
    seasons,
    selectedSeasonId:
      options?.selectedSeasonId ?? defaultSelectedSeasonId(seasons),
    banner: options?.banner,
    ...addSeason,
  };
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

/** Registers **`GET /admin`**, **`POST /admin/season-end-event`**, **`POST /admin/seasons`**. */
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
      const pageProps = await loadAdminPageProps(dbClient);
      const html = await Promise.resolve(renderAdminDocument(auth, pageProps));

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
        const pageProps = await loadAdminPageProps(dbClient, {
          banner: {
            kind: "error",
            title: "Invalid season",
            body: parsed.message,
          },
        });
        const html = await Promise.resolve(
          renderAdminDocument(auth, pageProps),
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
        const pageProps = await loadAdminPageProps(dbClient, {
          selectedSeasonId: String(parsed.data.season_id),
          banner: {
            kind: "error",
            title: "Could not re-send webhook",
            body: result.message,
          },
        });
        const html = await Promise.resolve(
          renderAdminDocument(auth, pageProps),
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

      const pageProps = await loadAdminPageProps(dbClient, {
        selectedSeasonId: String(result.season_id),
        banner: {
          kind: "success",
          title: "Webhook sent",
          body: `Season end webhook sent for ${result.season_name}.`,
        },
      });
      const html = await Promise.resolve(renderAdminDocument(auth, pageProps));
      res.status(200).type("html").send(html);
    }),
  );

  router.post(
    "/admin/seasons",
    requireWebAuth,
    requireWebAdmin,
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      if (auth.status !== "authenticated") {
        next(new Error("Admin create-season route reached without a session"));
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

      const parsed = parseAddSeasonForm(req.body);
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
        const pageProps = await loadAdminPageProps(dbClient, {
          banner: {
            kind: "error",
            title: "Invalid season",
            body: parsed.message,
          },
          addSeasonOverrides: {
            name: typeof req.body?.name === "string" ? req.body.name : "",
            start:
              typeof req.body?.start === "string" ? req.body.start : undefined,
            end: typeof req.body?.end === "string" ? req.body.end : undefined,
            payout_formula:
              typeof req.body?.payout_formula === "string"
                ? req.body.payout_formula
                : undefined,
          },
        });
        const html = await Promise.resolve(
          renderAdminDocument(auth, pageProps),
        );
        res.status(400).type("html").send(html);
        return;
      }

      const dbClient = await getDbClient(res);
      const result = await createSeason(dbClient, {
        name: parsed.data.name,
        start: parsed.data.start,
        end: parsed.data.end,
        payout_formula: parsed.data.payout_formula,
      });

      if (!result.ok) {
        const fragment = ErrorHtmxSnippet({
          title: "Could not create season",
          body: result.message,
        });
        if (isHtmx) {
          res.status(400).type("html").send(fragment);
          return;
        }
        const pageProps = await loadAdminPageProps(dbClient, {
          banner: {
            kind: "error",
            title: "Could not create season",
            body: result.message,
          },
          addSeasonOverrides: {
            name: parsed.data.name,
            start: formatDatetimeLocalUtc(parsed.data.start),
            end: formatDatetimeLocalUtc(parsed.data.end),
            payout_formula: parsed.data.payout_formula,
          },
        });
        const html = await Promise.resolve(
          renderAdminDocument(auth, pageProps),
        );
        res.status(400).type("html").send(html);
        return;
      }

      if (isHtmx) {
        res.set("HX-Redirect", "/admin");
        res.status(200).end();
        return;
      }

      const pageProps = await loadAdminPageProps(dbClient, {
        banner: {
          kind: "success",
          title: "Season created",
          body: `Created season “${result.season_name}” (#${result.season_id}).`,
        },
      });
      const html = await Promise.resolve(renderAdminDocument(auth, pageProps));
      res.status(200).type("html").send(html);
    }),
  );
};
