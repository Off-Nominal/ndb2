import express, { Request, Response } from "express";
import { getDbClient } from "../../middleware/getDbClient";
import { getPrediction } from "../../middleware/getPrediction";
import paramValidator from "../../middleware/paramValidator";
import responseUtils_deprecated from "../../utils/response";
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
    return res.json(
      responseUtils_deprecated.writeSuccess(
        req.prediction,
        "Prediction fetched successfully."
      )
    );
  }
);

export default router;
