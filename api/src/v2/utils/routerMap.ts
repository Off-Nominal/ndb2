import express, { Router } from "express";

export type Route = (router: Router) => void;

export const mapRoutes = (routes: Route[]) => {
  const router = express.Router();

  routes.forEach((route) => {
    route(router);
  });

  return router;
};
