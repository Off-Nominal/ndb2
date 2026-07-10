import { Router } from "express";
import { getMemberProfile } from "@domain/discord";
import { Route } from "@shared/routerMap";
import { resolveWebAdminAccess } from "../../auth/web-admin-access";
import { getWebAuth } from "../../middleware/auth/session";
import { requireWebAuth } from "../../middleware/auth/require-auth";
import { requireWebAdmin } from "../../middleware/auth/require-web-admin";
import { getColorScheme, getThemePreference } from "../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../middleware/error-boundary";
import { AuthenticatedPageLayout } from "../../shared/components/page-layout";
import { documentTitle } from "@web/shared/utils/document_title";
import { AdminPage } from "./page";

/** Registers **`GET /admin`** (host/mod-only placeholder). */
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

      const [discordProfile, showAdminNav] = await Promise.all([
        getMemberProfile(auth.discordId),
        resolveWebAdminAccess(auth.discordId),
      ]);
      const csrfHeadersJson = JSON.stringify({ "X-CSRF-Token": auth.csrfToken });

      const html = await Promise.resolve(
        <AuthenticatedPageLayout
          theme={getThemePreference()}
          colorScheme={getColorScheme()}
          title={documentTitle("Admin")}
          auth={auth}
          discordProfile={discordProfile}
          showAdminNav={showAdminNav}
          csrfMetaToken={auth.csrfToken}
          hxHeaders={csrfHeadersJson}
        >
          <AdminPage />
        </AuthenticatedPageLayout>,
      );

      res.type("html").send(html);
    }),
  );
};
