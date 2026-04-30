import { Router } from "express";
import { z } from "zod";
import { Route } from "@shared/routerMap";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import { getDbClient } from "@data/db/getDbClient";
import { wrapRouteWithErrorBoundary } from "../../middleware/errorHandler";
import { resultsCrossScopeListQuerySchema } from "../../validations";
import results from "@data/queries/results";

export const getResultsAllTime: Route = (router: Router) => {
  router.get(
    "/all-time",
    validate({
      query: resultsCrossScopeListQuerySchema,
    }),
    wrapRouteWithErrorBoundary(async (req, res) => {
      const dbClient = await getDbClient(res);
      const q = req.query as z.infer<typeof resultsCrossScopeListQuerySchema>;
      const payload = await results.getAllTimeLeaderboard(dbClient)({
        sort_by: q.sort_by,
        page: q.page,
        per_page: q.per_page,
      });

      return res.json(
        responseUtils.writeSuccess(
          payload,
          "All-time results fetched successfully.",
        ),
      );
    }),
  );

  return router;
};
