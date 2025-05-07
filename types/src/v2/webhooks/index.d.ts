import { Entities } from "..";

type BaseWebhookPayload = {
  event_id: string;
  emitted_at: string;
};

export type UntriggeredPrediction = BaseWebhookPayload & {
  event: "untriggered_prediction";
  data: Entities.Predictions.Prediction;
};
