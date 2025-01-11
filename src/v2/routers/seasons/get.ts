import { Router } from "express";
import seasons from "../../queries/seasons";
import responseUtils from "../../../utils/response";

export const getSeasonsRouterHandler = (router: Router) => {
  router.get("/", async (req, res) => {
    seasons
      .getAll(req.dbClient)()
      .then((response) => {
        res.json(
          responseUtils.writeSuccess(response, "Seasons fetched successfully.")
        );
      });
  });
};
