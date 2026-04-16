import { Prediction } from "./entities/predictions";
import { Season } from "./entities/seasons";

// Single source of truth for webhook events
const WEBHOOK_EVENTS = [
  "judged_prediction",
  "unjudged_prediction",
  "untriggered_prediction",
  "triggered_prediction",
  "triggered_snooze_check",
  "retired_prediction",
  "new_prediction",
  "new_bet",
  "new_vote",
  "prediction_edit",
  "new_snooze_vote",
  "snoozed_prediction",
  "season_start",
  "season_end",
] as const;

// Derive the type from the array
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type PredictionEditChangedFields = {
  check_date?: {
    old: string | null;
    new: string;
  };
};

export type BasePayload<E extends WebhookEvent, D> = {
  event_name: E;
  version: 2;
  date: Date;
  data: D;
};

export namespace Events {
  export type SeasonResults = {
    season: Season;
    predictions: {
      closed: number | null;
      successes: number | null;
      failures: number | null;
    };
    bets: {
      closed: number | null;
      successes: number | null;
      failures: number | null;
    };
    scores: {
      payouts: number;
      penalties: number;
    };
    largest_payout: {
      value: number;
      prediction_id: number;
      better: {
        id: string;
        discord_id: string;
      };
    } | null;
    largest_penalty: {
      value: number;
      prediction_id: number;
      better: {
        id: string;
        discord_id: string;
      };
    } | null;
  };

  export type JudgedPrediction = BasePayload<
    "judged_prediction",
    {
      prediction: Prediction;
    }
  >;
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
  export type TriggeredSnoozeCheck = BasePayload<
    "triggered_snooze_check",
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
  export type NewBet = BasePayload<
    "new_bet",
    {
      prediction: Prediction;
    }
  >;
  export type NewVote = BasePayload<
    "new_vote",
    {
      prediction: Prediction;
    }
  >;
  export type PredictionEdit = BasePayload<
    "prediction_edit",
    {
      prediction: Prediction;
      edited_fields: PredictionEditChangedFields;
    }
  >;
  export type NewSnoozeVote = BasePayload<
    "new_snooze_vote",
    {
      prediction: Prediction;
    }
  >;
  export type SnoozedPrediction = BasePayload<
    "snoozed_prediction",
    {
      prediction: Prediction;
    }
  >;
  export type SeasonStart = BasePayload<
    "season_start",
    {
      season: Season;
    }
  >;
  export type SeasonEnd = BasePayload<
    "season_end",
    {
      results: SeasonResults;
    }
  >;
}

export type Payload =
  | Events.JudgedPrediction
  | Events.UnjudgedPrediction
  | Events.UntriggeredPrediction
  | Events.TriggeredPrediction
  | Events.TriggeredSnoozeCheck
  | Events.RetiredPrediction
  | Events.NewPrediction
  | Events.NewBet
  | Events.NewVote
  | Events.PredictionEdit
  | Events.NewSnoozeVote
  | Events.SnoozedPrediction
  | Events.SeasonStart
  | Events.SeasonEnd;

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
