import express, { Router } from "express";

export type NDB2Route = (router: Router) => void;

export const routerMap = (routes: NDB2Route[]) => {
  const router = express.Router();

  routes.forEach((route) => {
    route(router);
  });

  return router;
};
