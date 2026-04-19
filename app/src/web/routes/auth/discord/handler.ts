import { randomBytes } from "node:crypto";
import { Router } from "express";
import { getDbClient } from "@data/db/getDbClient";
import oauthLoginStatesQueries from "@data/queries/oauth_login_states";
import usersQueries from "@data/queries/users";
import webSessionsQueries from "@data/queries/web_sessions";
import { Route } from "@shared/routerMap";
import { safeReturnTo } from "../../../auth/safeReturnTo";
import {
  buildDiscordAuthorizeUrl,
  exchangeDiscordOAuthCode,
  fetchDiscordCurrentUser,
} from "../../../auth/discordOAuth";
import { getWebAuth } from "../../../middleware/webAuthMiddleware";
import {
  SESSION_COOKIE_CONFIG,
  buildSessionPersistCookieHeader,
  buildSessionClearCookieHeader,
  newCsrfToken,
} from "../../../middleware/webSessionCookie";
import { oauth_error_page } from "./pages/oauth_error";
import { oauth_not_configured_page } from "./pages/oauth_not_configured";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function readDiscordOAuthEnv():
  | { clientId: string; clientSecret: string; redirectUri: string }
  | null {
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }
  return { clientId, clientSecret, redirectUri };
}

/** Discord OAuth start, callback, error page, and logout. */
export const DiscordAuth: Route = (router: Router) => {
  router.get("/auth/discord", async (req, res, next) => {
    try {
      const env = readDiscordOAuthEnv();
      if (!env) {
        const html = await Promise.resolve(oauth_not_configured_page());
        res.status(503).type("html").send(html);
        return;
      }

      const dbClient = await getDbClient(res);
      await dbClient.query(`DELETE FROM oauth_login_states WHERE expires_at < now()`);

      const returnTo = safeReturnTo(
        typeof req.query.returnTo === "string" ? req.query.returnTo : undefined,
      );
      const state = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

      await oauthLoginStatesQueries.insert(dbClient)({
        state,
        return_to: returnTo,
        expires_at: expiresAt,
      });

      const url = buildDiscordAuthorizeUrl({
        clientId: env.clientId,
        redirectUri: env.redirectUri,
        state,
      });
      res.redirect(302, url);
    } catch (err) {
      next(err);
    }
  });

  router.get("/auth/discord/callback", async (req, res, next) => {
    try {
      const env = readDiscordOAuthEnv();
      if (!env) {
        const html = await Promise.resolve(oauth_not_configured_page());
        res.status(503).type("html").send(html);
        return;
      }

      const oauthErr =
        typeof req.query.error === "string" ? req.query.error : undefined;
      if (oauthErr) {
        const html = await Promise.resolve(
          oauth_error_page({
            title: "Sign in cancelled",
            message:
              oauthErr === "access_denied"
                ? "Discord sign-in was cancelled."
                : `Discord returned an error: ${oauthErr}.`,
          }),
        );
        res.type("html").send(html);
        return;
      }

      const code = typeof req.query.code === "string" ? req.query.code : undefined;
      const state = typeof req.query.state === "string" ? req.query.state : undefined;
      if (!code || !state) {
        const html = await Promise.resolve(
          oauth_error_page({
            title: "Sign in failed",
            message: "Missing authorization code or state from Discord.",
          }),
        );
        res.status(400).type("html").send(html);
        return;
      }

      const dbClient = await getDbClient(res);
      const returnTo = await oauthLoginStatesQueries.takeReturnToForState(dbClient)(state);
      if (!returnTo) {
        const html = await Promise.resolve(
          oauth_error_page({
            title: "Sign in failed",
            message: "Invalid or expired sign-in state. Please try again.",
          }),
        );
        res.status(400).type("html").send(html);
        return;
      }

      const safePath = safeReturnTo(returnTo);

      let accessToken: string;
      try {
        ({ access_token: accessToken } = await exchangeDiscordOAuthCode({
          clientId: env.clientId,
          clientSecret: env.clientSecret,
          redirectUri: env.redirectUri,
          code,
        }));
      } catch {
        const html = await Promise.resolve(
          oauth_error_page({
            title: "Sign in failed",
            message: "Could not complete sign-in with Discord. Please try again.",
          }),
        );
        res.status(502).type("html").send(html);
        return;
      }

      let discordUser: { id: string };
      try {
        discordUser = await fetchDiscordCurrentUser(accessToken);
      } catch {
        const html = await Promise.resolve(
          oauth_error_page({
            title: "Sign in failed",
            message: "Could not load your Discord profile. Please try again.",
          }),
        );
        res.status(502).type("html").send(html);
        return;
      }

      const user = await usersQueries.getByDiscordId(dbClient)(discordUser.id);
      const sessionExpires = new Date(Date.now() + SESSION_COOKIE_CONFIG.maxAgeSec * 1000);
      const csrfToken = newCsrfToken();
      const sessionRow = await webSessionsQueries.insert(dbClient)({
        user_id: user.id,
        csrf_token: csrfToken,
        expires_at: sessionExpires,
      });

      if (!sessionRow) {
        next(new Error("insertWebSession returned no row"));
        return;
      }

      res.append("Set-Cookie", buildSessionPersistCookieHeader(sessionRow.id));
      res.redirect(302, safePath);
    } catch (err) {
      next(err);
    }
  });

  router.post("/auth/logout", async (req, res, next) => {
    try {
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
    } catch (err) {
      next(err);
    }
  });
};
