import { Router } from "express";
import { z } from "zod";
import { Route } from "../../utils/routerMap";
import responseUtils from "../../utils/response";
import { validate } from "../../middleware/validate";
import { getDbClient } from "../../utils/getDbClient";
import predictions from "../../queries/predictions";
import users from "../../queries/users";
import * as API from "@offnominal/ndb2-api-types/v2";
import { eventsManager } from "../../managers/events";
import { createFutureDateSchema, discordIdSchema } from "../../validations";

export const createPrediction: Route = (router: Router) => {
  router.post(
    "/",
    validate({
      body: createPredictionBodySchema,
    }),
    async (req, res) => {
      const body = req.body;
      const dbClient = await getDbClient(res);
      const now = new Date();

      try {
        let user = await users.getByDiscordId(dbClient)(body.discord_id);

        if (!user) {
          throw new Error("Unable to resolve user from discord_id");
        }

        let prediction_id: number;

        if (body.driver === "event") {
          prediction_id = await predictions.create(dbClient)({
            user_id: user.id,
            text: body.text,
            created_date: now,
            driver: body.driver,
            check_date: body.check_date,
          });
        } else {
          prediction_id = await predictions.create(dbClient)({
            user_id: user.id,
            text: body.text,
            created_date: now,
            driver: body.driver,
            due_date: body.due_date,
          });
        }

        const prediction = await predictions.getById(dbClient)(prediction_id);
        if (!prediction) {
          throw new Error("Prediction not found after creation");
        }

        eventsManager.emit("new_prediction", prediction);

        return res.json(
          responseUtils.writeSuccess(
            prediction,
            "Prediction created successfully."
          )
        );
      } catch (error) {
        console.error("Error creating prediction:", error);
        return res.status(500).json(
          responseUtils.writeErrors([
            {
              code: API.Errors.SERVER_ERROR,
              message: "Error creating prediction.",
            },
          ])
        );
      }
    }
  );
};

/**
 * Schema for validating prediction text.
 * Validates that a value is a non-empty string.
 */
const predictionTextSchema = z
  .string({
    message: "Prediction text is required",
  })
  .min(1, "Prediction text must not be empty");

const createPredictionBodySchema = z.discriminatedUnion("driver", [
  z.object({
    text: predictionTextSchema,
    discord_id: discordIdSchema,
    driver: z.literal("event"),
    check_date: createFutureDateSchema({ fieldName: "check_date" }),
  }),
  z.object({
    text: predictionTextSchema,
    discord_id: discordIdSchema,
    driver: z.literal("date"),
    due_date: createFutureDateSchema({ fieldName: "due_date" }),
  }),
]);
