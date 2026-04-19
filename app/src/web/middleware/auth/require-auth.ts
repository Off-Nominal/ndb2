import type { RequestHandler } from "express";
import { safeReturnTo } from "../../auth/safeReturnTo";
import { getWebAuth } from "./session";

/** Redirects anonymous users to the login page; preserves path in `returnTo`. */
export const requireWebAuth: RequestHandler = (req, res, next) => {
  const auth = getWebAuth();
  if (auth.status === "authenticated") {
    next();
    return;
  }
  const pathOnly = req.originalUrl.split("?")[0] || "/";
  const returnTo = safeReturnTo(pathOnly);
  const q = new URLSearchParams({ returnTo });
  res.redirect(302, `/login?${q.toString()}`);
};
