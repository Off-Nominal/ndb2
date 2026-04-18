import { Router } from "express";
import { Route } from "../../../shared/routerMap";

export const Home: Route = (router: Router) => {
  router.get("/", (req, res) => {
    res.render("pages/home", {
      title: "NDB2",
      message: "welcome to the new ndb2 portal",
    });
  });
};
