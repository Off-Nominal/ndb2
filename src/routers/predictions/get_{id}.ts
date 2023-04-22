import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import { getPrediction } from "../../middleware/getPrediction";
import paramValidator from "../../middleware/paramValidator";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get(
  "/:prediction_id",
  [
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getDbClient,
    getPrediction,
  ],
  async (req: Request, res: Response) => {
    res.json(
      responseUtils.writeSuccess(
        req.prediction,
        "Prediction fetched successfully."
      )
    );
    req.dbClient.release();
  }
);

export default router;
