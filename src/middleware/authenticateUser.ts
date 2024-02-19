import { NextFunction, Request, Response } from "express";
import authAPI from "../utils/auth";
import { sub } from "date-fns";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.path === "/signin") {
    return next();
  }

  const redirectTo = req.originalUrl;
  const token = req.cookies.token;

  // Not logged in, redirect to signin with appropriate returnTo
  if (!token) {
    return res.redirect(`/signin?returnTo=${encodeURIComponent(redirectTo)}`);
  }

  const payload = await authAPI.verify(token);

  // payload missing, redirect to signin with appropriate returnTo
  if (!payload) {
    return res.redirect(`/signin?returnTo=${encodeURIComponent(redirectTo)}`);
  }

  // payload is fresh, add to request object and continue
  if (payload.iat * 1000 > sub(new Date(), { days: 1 }).getTime()) {
    req.authenticated_user = payload;
    return next();
  }

  // payload is stale, refresh and continue
  const newToken = await authAPI.sign(payload);
  res.cookie("token", newToken, authAPI.buildCookieOptions());
  next();
};
