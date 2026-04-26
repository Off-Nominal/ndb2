import { config } from "@config";
import { randomBytes } from "node:crypto";
import { Router } from "express";
import { getDbClient } from "@data/db/getDbClient";
import oauthLoginStatesQueries from "@data/queries/oauth_login_states";
import usersQueries from "@data/queries/users";
import webSessionsQueries from "@data/queries/web_sessions";
import { Route } from "@shared/routerMap";
import { safeReturnTo } from "../../../auth/safeReturnTo";
import { fetchGuildMember, type GuildMemberSummary } from "@domain/discord";
import {
  buildDiscordAuthorizeUrl,
  discordPkceCodeChallengeS256,
  exchangeDiscordOAuthCode,
  fetchDiscordCurrentUser,
  newDiscordPkceCodeVerifier,
} from "../../../auth/discordOAuth";
import { getWebAuth } from "../../../middleware/auth/session";
import {
  SESSION_COOKIE_CONFIG,
  buildSessionClearCookieHeader,
  buildSessionPersistCookieHeader,
  newCsrfToken,
} from "../../../middleware/auth/session-cookie-utils";
import { getColorScheme, getThemePreference } from "../../../middleware/theme-preference";
import { wrapWebRouteWithErrorBoundary } from "../../../middleware/error-boundary";
import type { ErrorPageProps } from "../../../shared/components/error_page";
import { ErrorPage } from "../../../shared/components/error_page";
import { PageLayout } from "../../../shared/components/page_layout";
import {
  DiscordPortalRequiresAllowedRoleBody,
  DiscordPortalRequiresGuildMembershipBody,
} from "./discord_oauth_error_partials";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function renderAppErrorPage(props: ErrorPageProps) {
  return Promise.resolve(
    <PageLayout theme={getThemePreference()} colorScheme={getColorScheme()} title={props.title}>
      <ErrorPage {...props} />
    </PageLayout>,
  );
}

/** Discord OAuth start, callback, error page, and logout. */
export const DiscordAuth: Route = (router: Router) => {
  router.get(
    "/auth/discord",
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const oauth = config.discord.oauth;
      const portalAuthz = config.discord.webPortal;

      const dbClient = await getDbClient(res);
      await dbClient.query(
        `DELETE FROM oauth_login_states WHERE expires_at < now()`,
      );

      const returnTo = safeReturnTo(
        typeof req.query.returnTo === "string" ? req.query.returnTo : undefined,
      );
      const state = randomBytes(32).toString("base64url");
      const codeVerifier = newDiscordPkceCodeVerifier();
      const codeChallenge = discordPkceCodeChallengeS256(codeVerifier);
      const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

      await oauthLoginStatesQueries.insert(dbClient)({
        state,
        return_to: returnTo,
        expires_at: expiresAt,
        code_verifier: codeVerifier,
      });

      const url = buildDiscordAuthorizeUrl({
        clientId: oauth.clientId,
        redirectUri: oauth.redirectUri,
        state,
        codeChallenge,
      });
      res.redirect(302, url);
    }),
  );

  router.get(
    "/auth/discord/callback",
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const oauth = config.discord.oauth;
      const portalAuthz = config.discord.webPortal;

      const oauthErr =
        typeof req.query.error === "string" ? req.query.error : undefined;
      if (oauthErr) {
        const html = await renderAppErrorPage({
          title: "Sign in cancelled",
          body:
            oauthErr === "access_denied"
              ? "Discord sign-in was cancelled."
              : `Discord returned an error: ${oauthErr}.`,
        });
        res.type("html").send(html);
        return;
      }

      const code =
        typeof req.query.code === "string" ? req.query.code : undefined;
      const state =
        typeof req.query.state === "string" ? req.query.state : undefined;
      if (!code || !state) {
        const html = await renderAppErrorPage({
          title: "Sign in failed",
          body: "Missing authorization code or state from Discord.",
        });
        res.status(400).type("html").send(html);
        return;
      }

      const dbClient = await getDbClient(res);
      const loginState =
        await oauthLoginStatesQueries.takeOauthLoginState(dbClient)(state);
      if (!loginState) {
        const html = await renderAppErrorPage({
          title: "Sign in failed",
          body: "Invalid or expired sign-in state. Please try again.",
        });
        res.status(400).type("html").send(html);
        return;
      }

      const safePath = safeReturnTo(loginState.return_to);

      let accessToken: string;
      try {
        ({ access_token: accessToken } = await exchangeDiscordOAuthCode({
          clientId: oauth.clientId,
          clientSecret: oauth.clientSecret,
          redirectUri: oauth.redirectUri,
          code,
          codeVerifier: loginState.code_verifier,
        }));
      } catch {
        const html = await renderAppErrorPage({
          title: "Sign in failed",
          body: "Could not complete sign-in with Discord. Please try again.",
        });
        res.status(502).type("html").send(html);
        return;
      }

      let discordUser: { id: string };
      try {
        discordUser = await fetchDiscordCurrentUser(accessToken);
      } catch {
        const html = await renderAppErrorPage({
          title: "Sign in failed",
          body: "Could not load your Discord profile. Please try again.",
        });
        res.status(502).type("html").send(html);
        return;
      }

      let member: GuildMemberSummary | null;
      try {
        member = await fetchGuildMember(
          portalAuthz.botToken,
          portalAuthz.guildId,
          discordUser.id,
        );
      } catch {
        const html = await renderAppErrorPage({
          title: "Sign in failed",
          body: "Could not verify your Discord server membership. Please try again.",
        });
        res.status(502).type("html").send(html);
        return;
      }

      if (!member) {
        const html = await renderAppErrorPage({
          title: "Access denied",
          body: DiscordPortalRequiresGuildMembershipBody(),
        });
        res.status(403).type("html").send(html);
        return;
      }

      const allowed = portalAuthz.allowedRoleIds.some((id) =>
        member.roles.includes(id),
      );
      if (!allowed) {
        const html = await renderAppErrorPage({
          title: "Access denied",
          body: DiscordPortalRequiresAllowedRoleBody(),
        });
        res.status(403).type("html").send(html);
        return;
      }

      const user = await usersQueries.getByDiscordId(dbClient)(discordUser.id);
      const sessionExpires = new Date(
        Date.now() + SESSION_COOKIE_CONFIG.maxAgeSec * 1000,
      );
      const csrfToken = newCsrfToken();
      const sessionRow = await webSessionsQueries.insert(dbClient)({
        user_id: user.id,
        csrf_token: csrfToken,
        expires_at: sessionExpires,
        last_discord_authz_at: new Date(),
      });

      if (!sessionRow) {
        next(new Error("insertWebSession returned no row"));
        return;
      }

      res.append("Set-Cookie", buildSessionPersistCookieHeader(sessionRow.id));
      res.redirect(302, safePath);
    }),
  );

  router.post(
    "/auth/logout",
    wrapWebRouteWithErrorBoundary(async (req, res, next) => {
      const auth = getWebAuth();
      const body = req.body as { _csrf?: string } | undefined;
      const headerToken =
        typeof req.headers["x-csrf-token"] === "string"
          ? req.headers["x-csrf-token"]
          : undefined;
      const token = body?._csrf ?? headerToken;

      if (auth.status !== "authenticated") {
        res.append("Set-Cookie", buildSessionClearCookieHeader());
        res.redirect(302, "/");
        return;
      }

      if (!token || token !== auth.csrfToken) {
        res.append("Set-Cookie", buildSessionClearCookieHeader());
        res.status(403).type("text/plain").send("Invalid CSRF token");
        return;
      }

      const dbClient = await getDbClient(res);
      await webSessionsQueries.revoke(dbClient)(auth.sessionId);
      res.append("Set-Cookie", buildSessionClearCookieHeader());
      res.redirect(302, "/");
    }),
  );
};
