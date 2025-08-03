import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/deprecated/getDbClient";
import seasons from "../../db/queries/seasons";
import responseUtils_deprecated from "../../utils/response";
import { ErrorCode } from "../../types/responses";

const router = express.Router();

router.get("/", getDbClient, async (req: Request, res: Response) => {
  if (!req.dbClient) {
    return res
      .status(500)
      .json(
        responseUtils_deprecated.writeError(
          ErrorCode.SERVER_ERROR,
          "Something went wrong. Please try again.",
          null
        )
      );
  }

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
