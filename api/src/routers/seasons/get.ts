import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import seasons from "../../db/queries/seasons";
import responseUtils_deprecated from "../../utils/response";

const router = express.Router();

router.get("/", getDbClient, async (req: Request, res: Response) => {
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

export default router;
