import express from "express";
import { getSeasonsRouterHandler } from "./get";

const router = express.Router();

export default () => {
  getSeasonsRouterHandler(router);

  return router;
};
