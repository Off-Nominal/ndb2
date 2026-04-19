import { config } from "@config";
import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";
import type { PoolClient } from "pg";
import { getDbClient } from "@data/db/getDbClient";
import webSessionsQueries from "@data/queries/web_sessions";
import { fetchGuildMember } from "@domain/discord";
import {
  buildSessionClearCookieHeader,
  parseSessionCookie,
} from "./session-cookie-utils.js";

export type WebAuthAnonymous = { status: "anonymous" };

export type WebAuthAuthenticated = {
  status: "authenticated";
  userId: string;
  discordId: string;
  sessionId: string;
  csrfToken: string;
  /** When guild/role authorization was last verified (OAuth or recheck). */
  lastDiscordAuthzAt: Date;
};

export type WebAuthContext = WebAuthAnonymous | WebAuthAuthenticated;

const webAuthAsyncLocalStorage = new AsyncLocalStorage<WebAuthContext>();

/** Auth for the current request (set by {@link webAuthMiddleware}). */
export function getWebAuth(): WebAuthContext {
  return webAuthAsyncLocalStorage.getStore() ?? { status: "anonymous" };
}

type SessionRow = {
  id: string;
  user_id: string;
  csrf_token: string;
  last_discord_authz_at: Date;
  discord_id: string;
};

/**
 * If `last_discord_authz_at` is older than the configured interval, re-verify
 * guild + roles. Revokes the session on failure or misconfiguration; on
 * transient Discord errors keeps the session and retries on a later request.
 */
async function recheckDiscordAuthzIfStale(
  dbClient: PoolClient,
  row: SessionRow,
): Promise<
  { outcome: "active"; lastDiscordAuthzAt: Date } | { outcome: "revoked" }
> {
  const intervalMs = config.discord.authzRecheckMs;
  const ageMs = Date.now() - row.last_discord_authz_at.getTime();
  if (ageMs < intervalMs) {
    return { outcome: "active", lastDiscordAuthzAt: row.last_discord_authz_at };
  }

  const portal = config.discord.webPortal;

  try {
    const member = await fetchGuildMember(
      portal.botToken,
      portal.guildId,
      row.discord_id,
    );
    if (!member) {
      await webSessionsQueries.revoke(dbClient)(row.id);
      return { outcome: "revoked" };
    }
    const allowed = portal.allowedRoleIds.some((id) =>
      member.roles.includes(id),
    );
    if (!allowed) {
      await webSessionsQueries.revoke(dbClient)(row.id);
      return { outcome: "revoked" };
    }
  } catch (err) {
    console.warn(
      "[webAuth] Discord authz recheck failed; keeping session until next attempt",
      err,
    );
    return { outcome: "active", lastDiscordAuthzAt: row.last_discord_authz_at };
  }

  const now = new Date();
  const updated = await webSessionsQueries.updateLastDiscordAuthzAt(dbClient)({
    id: row.id,
    last_discord_authz_at: now,
  });
  return {
    outcome: "active",
    lastDiscordAuthzAt: updated?.last_discord_authz_at ?? now,
  };
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

      const recheck = await recheckDiscordAuthzIfStale(dbClient, row);
      if (recheck.outcome === "revoked") {
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
        lastDiscordAuthzAt: recheck.lastDiscordAuthzAt,
      };
      webAuthAsyncLocalStorage.run(ctx, () => next());
    } catch (err) {
      next(err);
    }
  })();
};
