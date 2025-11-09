import { Router } from "express";
import seasons from "../../queries/seasons";
import responseUtils_deprecated from "../../../utils/response";
import { getDbClient } from "../../middleware/getDbClient";
import { Route } from "../../utils/routerMap";

export const getAllSeasons: Route = (router: Router) => {
  router.get("/", async (req, res) => {
    const dbClient = await getDbClient(res);

    seasons
      .getAll(dbClient)()
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
