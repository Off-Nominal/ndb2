import type { RequestHandler } from "express";
import { renderAccessDeniedPage } from "@web/shared/components/access-denied-page";
import { checkWebAdminAccess } from "../../auth/web-admin-access";
import { getWebAuth } from "./session";

/** Denies access unless the signed-in user has a host or mod Discord role. */
export const requireWebAdmin: RequestHandler = (req, res, next) => {
  const auth = getWebAuth();
  if (auth.status !== "authenticated") {
    next(new Error("requireWebAdmin reached without an authenticated session"));
    return;
  }

  void (async () => {
    const result = await checkWebAdminAccess(auth.discordId);
    if (result.ok) {
      next();
      return;
    }

    if (result.reason === "discord_error") {
      const html = await renderAccessDeniedPage({
        title: "Access check failed",
        body: "Could not verify your Discord roles. Please try again.",
      });
      res.status(502).type("html").send(html);
      return;
    }

    const html = await renderAccessDeniedPage({
      title: "Access denied",
      body: "The admin section is limited to hosts and mods.",
    });
    res.status(403).type("html").send(html);
  })();
};
