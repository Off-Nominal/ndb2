import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { predictionIdSchema } from "../../validations";
import { NDB2Route } from "../../utils/routerMap";

const RequestSchema = {
  params: z.object({
    prediction_id: predictionIdSchema,
  }),
};

export const getPredictionByIdHandler: NDB2Route = (router: Router) => {
  router.get(
    "/:prediction_id",
    validateRequest(RequestSchema),
    async (req, res) => {
      const { prediction_id } = req.params;
      res.json({ prediction_id });
    }
  );
};
