import EventEmitter from "events";

// V1 Types
import { APISeasons } from "../types/seasons";
import { APIPredictions } from "../types/predicitions";

// V2 Types
import { Predictions } from "../v2/types/predictions";

type PredictionEditChangedFields = {
  check_date?: {
    old: Date;
    new: Date;
  };
};

interface WebhookEvent {
  new_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  retired_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  new_bet: (bet: APIPredictions.EnhancedPrediction) => void;
  triggered_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  triggered_snooze_check: (
    prediction: APIPredictions.EnhancedPrediction
  ) => void;
  untriggered_prediction: (
    prediction: APIPredictions.EnhancedPrediction | Predictions.GET_ById
  ) => void;
  new_vote: (prediction: APIPredictions.EnhancedPrediction) => void;
  judged_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  new_snooze_check: (prediction: APIPredictions.EnhancedPrediction) => void;
  new_snooze_vote: (prediction: APIPredictions.EnhancedPrediction) => void;
  snoozed_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  prediction_edit: (
    prediction: APIPredictions.EnhancedPrediction,
    edited_fields: PredictionEditChangedFields
  ) => void;
  season_start: (season: APISeasons.Season) => void;
  season_end: (results: APISeasons.GetResultsBySeasonId) => void;
}

type WebhookNotification<T> = {
  event_name: keyof WebhookEvent;
  date: Date;
  data: T;
};

export class WebhookManager extends EventEmitter {
  private _untypedOn = this.on;
  private _untypedEmit = this.emit;

  public on = <K extends keyof WebhookEvent>(
    event: K,
    listener: WebhookEvent[K]
  ): this => this._untypedOn(event, listener);

  public emit = <K extends keyof WebhookEvent>(
    event: K,
    ...args: Parameters<WebhookEvent[K]>
  ): boolean => this._untypedEmit(event, ...args);

  private subscribers: string[];

  constructor(subscribers: string[]) {
    super();
    this.subscribers = subscribers;

    this.on(
      "new_prediction",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("new_prediction", { prediction })
        );
      }
    );

    this.on(
      "retired_prediction",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("retired_prediction", { prediction })
        );
      }
    );

    this.on(
      "triggered_prediction",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("triggered_prediction", { prediction })
        );
      }
    );

    this.on(
      "triggered_snooze_check",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("triggered_snooze_check", { prediction })
        );
      }
    );

    this.on(
      "untriggered_prediction",
      <T extends APIPredictions.EnhancedPrediction | Predictions.GET_ById>(
        prediction: T
      ) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: T;
          }>("untriggered_prediction", { prediction })
        );
      }
    );

    this.on("new_bet", (prediction: APIPredictions.EnhancedPrediction) => {
      this.notifySubscribers(
        this.generateResponse<{
          prediction: APIPredictions.EnhancedPrediction;
        }>("new_bet", { prediction })
      );
    });

    this.on("new_vote", (prediction: APIPredictions.EnhancedPrediction) => {
      this.notifySubscribers(
        this.generateResponse<{
          prediction: APIPredictions.EnhancedPrediction;
        }>("new_vote", { prediction })
      );
    });

    this.on(
      "judged_prediction",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("judged_prediction", { prediction })
        );
      }
    );

    this.on(
      "new_snooze_check",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("new_snooze_check", { prediction })
        );
      }
    );

    this.on(
      "new_snooze_vote",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("new_snooze_vote", { prediction })
        );
      }
    );

    this.on(
      "snoozed_prediction",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
          }>("snoozed_prediction", { prediction })
        );
      }
    );

    this.on(
      "prediction_edit",
      (
        prediction: APIPredictions.EnhancedPrediction,
        edited_fields: PredictionEditChangedFields
      ) => {
        this.notifySubscribers(
          this.generateResponse<{
            prediction: APIPredictions.EnhancedPrediction;
            edited_fields: PredictionEditChangedFields;
          }>("prediction_edit", { prediction, edited_fields })
        );
      }
    );

    this.on("season_start", (season: APISeasons.Season) => {
      this.notifySubscribers(
        this.generateResponse<{ season: APISeasons.Season }>("season_start", {
          season,
        })
      );
    });

    this.on("season_end", (results: APISeasons.GetResultsBySeasonId) => {
      this.notifySubscribers(
        this.generateResponse<{ results: APISeasons.GetResultsBySeasonId }>(
          "season_end",
          { results }
        )
      );
    });
  }

  private generateResponse = <T>(event_name: keyof WebhookEvent, data: T) => {
    const response: WebhookNotification<T> = {
      event_name,
      date: new Date(),
      data,
    };

    return response;
  };

  private notifySubscribers = <K>(data: WebhookNotification<K>) => {
    const requests = [];

    for (const sub of this.subscribers) {
      const request: RequestInit = {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DISCORD_CLIENT_API_KEY}`,
        },
      };

      const promise = fetch(sub, request)
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
        })
        .catch((err) => {
          console.error("Subscriber webhook request failed: ", sub);
          console.error(err);
        });

      requests.push(promise);
    }
  };
}
