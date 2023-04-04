import express, { Request, Response } from "express";
import { getPrediction } from "../../middleware/getPrediction";
import paramValidator from "../../middleware/paramValidator";
import responseUtils from "../../utils/response";
const router = express.Router();

router.get(
  "/:prediction_id",
  [
    paramValidator.integerParseableString("prediction_id", { type: "params" }),
    paramValidator.isPostgresInt("prediction_id", { type: "params" }),
    getPrediction,
  ],
  async (req: Request, res: Response) => {
    res.json(
      responseUtils.writeSuccess(
        req.prediction,
        "Prediction fetched successfully."
      )
    );
  }
);

export default router;
