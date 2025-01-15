import { Router } from "express";
import seasons from "../../queries/seasons";
import responseUtils from "../../../utils/response";
import { getDbClient } from "../../../middleware/getDbClient";
import { NDB2Route } from "../../utils/routerMap";

export const getAllSeasons: NDB2Route = (router: Router) => {
  router.get("/", getDbClient, async (req, res) => {
    seasons
      .getAll(req.dbClient)()
      .then((response) => {
        res.json(
          responseUtils.writeSuccess(response, "Seasons fetched successfully.")
        );
      });
  });

  return router;
};
