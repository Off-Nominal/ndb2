import express from "express";
import crypto from "crypto";
import discordAPI from "../../../utils/discord";
import { add } from "date-fns";
import { RESTGetAPIGuildMemberResult } from "discord-api-types/v10";
import { APIAuth } from "../../../types/auth";
import authAPI from "../../../utils/auth";

const authRouter = express.Router();

authRouter.get("/signout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/signin");
});

authRouter.get("/oauth", async (req, res) => {
  const { code, returnTo } = req.query;

  // If we don't have a code, we need to redirect to Discord to log in
  if (typeof code !== "string") {
    const state = {
      returnTo: returnTo ?? "/",
      nonce: crypto.randomBytes(16).toString("hex") + Date.now().toString(),
    };

    const cookie = Buffer.from(JSON.stringify(state)).toString("base64");

    res.cookie("state", cookie, {
      expires: add(new Date(), { minutes: 5 }),
      httpOnly: true,
    });

    return res.redirect(discordAPI.getOAuthUrl(state.nonce));
  }

  // Check for state values
  const cookie = req.cookies.state;

  if (typeof req.query.state !== "string" || !cookie) {
    console.log(typeof req.query.state, cookie);
    return res.redirect("/signin?error=state");
  }

  let returnToPath: string = "";

  try {
    const state = JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
    if (state.nonce !== req.query.state) {
      throw new Error("Nonce does not match");
    }
    returnToPath = state.returnTo;
    res.clearCookie("state");
  } catch (err) {
    return res.redirect("/signin?error=state");
  }

  let access_token: string;

  try {
    const response = await discordAPI.authenticate(code);
    access_token = response.access_token;
  } catch (err) {
    return res.redirect("/signin?error=auth");
  }

  let member: RESTGetAPIGuildMemberResult;

  try {
    member = await discordAPI.identify(access_token);
  } catch (err) {
    return res.redirect("/signin?error=identify");
  }

  let user: APIAuth.User | null;

  try {
    const response = await discordAPI.authorize(member);
    if (response.error) {
      throw new Error(response.error);
    } else {
      user = response.user;
    }
  } catch (err) {
    console.error(err);
    return res.redirect("/signin?error=authorize");
  }

  try {
    const token = await authAPI.sign(user);
    res.cookie("token", token, authAPI.buildCookieOptions());
  } catch (err) {
    console.error(err);
  }

  return res.redirect(returnToPath);
});

export default authRouter;
