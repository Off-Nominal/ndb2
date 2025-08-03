import { Router } from "express";
import seasons from "../../queries/seasons";
import responseUtils_deprecated from "../../../utils/response";
import { getDbClient } from "../../../middleware/deprecated/getDbClient";
import { Route } from "../../utils/routerMap";

export const getAllSeasons: Route = (router: Router) => {
  router.get("/", getDbClient, async (req, res) => {
    seasons
      .getAll(req.dbClient)()
      .then((response) => {
        res.json(
          responseUtils_deprecated.writeSuccess(
            response,
            "Seasons fetched successfully."
          )
        );
      });
  });

  return router;
};
