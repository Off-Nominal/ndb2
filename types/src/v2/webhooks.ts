import { Prediction } from "./entities/predictions";

// Single source of truth for webhook events
const WEBHOOK_EVENTS = [
  "unjudged_prediction",
  "untriggered_prediction",
  "triggered_prediction",
  "retired_prediction",
  "new_prediction",
] as const;

// Derive the type from the array
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type BasePayload<E extends WebhookEvent, D> = {
  event_name: E;
  version: 2;
  date: Date;
  data: D;
};

export namespace Events {
  export type UnjudgedPrediction = BasePayload<
    "unjudged_prediction",
    {
      prediction: Prediction;
    }
  >;
  export type UntriggeredPrediction = BasePayload<
    "untriggered_prediction",
    {
      prediction: Prediction;
    }
  >;
  export type TriggeredPrediction = BasePayload<
    "triggered_prediction",
    {
      prediction: Prediction;
    }
  >;
  export type RetiredPrediction = BasePayload<
    "retired_prediction",
    {
      prediction: Prediction;
    }
  >;
  export type NewPrediction = BasePayload<
    "new_prediction",
    {
      prediction: Prediction;
    }
  >;
}

export type Payload =
  | Events.UnjudgedPrediction
  | Events.UntriggeredPrediction
  | Events.TriggeredPrediction
  | Events.RetiredPrediction
  | Events.NewPrediction;
