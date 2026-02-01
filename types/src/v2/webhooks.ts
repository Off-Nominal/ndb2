import { Prediction } from "./entities/predictions";

// Single source of truth for webhook events
const WEBHOOK_EVENTS = [
  "unjudged_prediction",
  "untriggered_prediction",
  "triggered_prediction",
  "retired_prediction",
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
}

export type Payload =
  | Events.UnjudgedPrediction
  | Events.UntriggeredPrediction
  | Events.TriggeredPrediction
  | Events.RetiredPrediction;

export const isWebhookPayloadV2 = (payload: any): payload is Payload => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  // Validate event_name against WebhookEvent type
  if (
    typeof payload.event_name !== "string" ||
    !WEBHOOK_EVENTS.includes(payload.event_name as WebhookEvent)
  ) {
    return false;
  }

  // Validate version
  if (payload.version !== 2) {
    return false;
  }

  // Validate date (can be Date object or string that parses to valid date)
  if (!payload.date) {
    return false;
  }
  const date =
    payload.date instanceof Date ? payload.date : new Date(payload.date);
  if (isNaN(date.getTime())) {
    return false;
  }

  if (payload.data === undefined) {
    return false;
  }

  return true;
};
