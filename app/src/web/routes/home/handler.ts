import { Router } from "express";
import { Route } from "@shared/routerMap";
import { LuckyNumber } from "./components/LuckyNumber";
import { HomePage } from "./page";

/** Registers `/` and HTMX-targeted `GET /home/lucky-number`. */
export const Home: Route = (router: Router) => {
  router.get("/", async (req, res, next) => {
    try {
      const html = await Promise.resolve(
        HomePage({
          title: "NDB2",
          message: "welcome to the new ndb2 portal",
        }),
      );
      res.type("html").send(html);
    } catch (err) {
      next(err);
    }
  });

  router.get("/home/lucky-number", async (req, res, next) => {
    try {
      const value = Math.floor(Math.random() * 1_000_000);
      const html = await Promise.resolve(LuckyNumber({ value }));
      res.type("html").send(html);
    } catch (err) {
      next(err);
    }
  });
};
