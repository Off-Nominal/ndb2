import { Prediction } from "./entities/predictions";

export type WebhookEvent = "untriggered_prediction";

export type BasePayload<E extends WebhookEvent, D> = {
  event_name: E;
  version: 2;
  date: Date;
  data: D;
};

export namespace Events {
  export type UntriggeredPrediction = BasePayload<
    "untriggered_prediction",
    {
      prediction: Prediction;
    }
  >;
}

export type Payload = Events.UntriggeredPrediction;
