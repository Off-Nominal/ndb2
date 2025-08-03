import express from "express";
import { getDbClient } from "../../middleware/getDbClient";
import { getPrediction } from "../../middleware/getPrediction";
import paramValidator from "../../middleware/paramValidator";
import responseUtils_deprecated from "../../utils/response";
const router = express.Router();

router.get(
  "/:prediction_id",
  paramValidator.integerParseableString("prediction_id", { type: "params" }),
  paramValidator.isPostgresInt("prediction_id", { type: "params" }),
  getDbClient,
  getPrediction,
  async (req, res) => {
    return res.json(
      responseUtils_deprecated.writeSuccess(
        res.locals.prediction,
        "Prediction fetched successfully."
      )
    );
  }
);

export default router;
