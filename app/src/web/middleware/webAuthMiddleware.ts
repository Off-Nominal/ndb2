import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";
import { getDbClient } from "@data/db/getDbClient";
import webSessionsQueries from "@data/queries/web_sessions";
import {
  buildSessionClearCookieHeader,
  parseSessionCookie,
} from "./webSessionCookie.js";

export type WebAuthAnonymous = { status: "anonymous" };

export type WebAuthAuthenticated = {
  status: "authenticated";
  userId: string;
  discordId: string;
  sessionId: string;
  csrfToken: string;
};

export type WebAuthContext = WebAuthAnonymous | WebAuthAuthenticated;

const webAuthAsyncLocalStorage = new AsyncLocalStorage<WebAuthContext>();

/** Auth for the current request (set by {@link webAuthMiddleware}). */
export function getWebAuth(): WebAuthContext {
  return webAuthAsyncLocalStorage.getStore() ?? { status: "anonymous" };
}

export const webAuthMiddleware: RequestHandler = (req, res, next) => {
  const raw = parseSessionCookie(req.headers.cookie);
  if (!raw) {
    webAuthAsyncLocalStorage.run({ status: "anonymous" }, () => next());
    return;
  }

  void (async () => {
    try {
      const dbClient = await getDbClient(res);
      const row = await webSessionsQueries.getValidWithUser(dbClient)(raw);
      if (!row) {
        res.append("Set-Cookie", buildSessionClearCookieHeader());
        webAuthAsyncLocalStorage.run({ status: "anonymous" }, () => next());
        return;
      }
      const ctx: WebAuthAuthenticated = {
        status: "authenticated",
        userId: row.user_id,
        discordId: row.discord_id,
        sessionId: row.id,
        csrfToken: row.csrf_token,
      };
      webAuthAsyncLocalStorage.run(ctx, () => next());
    } catch (err) {
      next(err);
    }
  })();
};
