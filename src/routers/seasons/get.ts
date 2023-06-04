import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import seasons from "../../queries/seasons";
import responseUtils from "../../utils/response";

const router = express.Router();

router.get("/", getDbClient, async (req: Request, res: Response) => {
  seasons
    .getAll(req.dbClient)()
    .then((response) => {
      res.json(
        responseUtils.writeSuccess(response, "Seasons fetched successfully.")
      );
    });
});

export default router;
