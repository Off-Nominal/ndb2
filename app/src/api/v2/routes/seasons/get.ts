import { Router } from "express";
import seasons from "../../../../data/queries/seasons";
import responseUtils_deprecated from "../../../../api/v1/utils/response";
import { getDbClient } from "../../../../data/db/getDbClient";
import { Route } from "../../utils/routerMap";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";

export const getAllSeasons: Route = (router: Router) => {
  router.get(
    "/",
    wrapRouteWithErrorBoundary(async (req, res) => {
      const dbClient = await getDbClient(res);

      seasons
        .getAll(dbClient)()
        .then((response) => {
          res.json(
            responseUtils_deprecated.writeSuccess(
              response,
              "Seasons fetched successfully.",
            ),
          );
        });
    }),
  );

  return router;
};
