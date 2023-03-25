import axios from "axios";
import EventEmitter from "events";
import { APIPredictions } from "../types/predicitions";

interface WebhookEvent {
  new_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  retired_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  new_bet: (bet: APIPredictions.EnhancedPrediction) => void;
  triggered_prediction: (prediction: APIPredictions.EnhancedPrediction) => void;
  new_vote: (prediction: APIPredictions.EnhancedPrediction) => void;
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
          this.generateResponse<APIPredictions.EnhancedPrediction>(
            "new_prediction",
            prediction
          )
        );
      }
    );

    this.on(
      "retired_prediction",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<APIPredictions.EnhancedPrediction>(
            "retired_prediction",
            prediction
          )
        );
      }
    );

    this.on(
      "triggered_prediction",
      (prediction: APIPredictions.EnhancedPrediction) => {
        this.notifySubscribers(
          this.generateResponse<APIPredictions.EnhancedPrediction>(
            "triggered_prediction",
            prediction
          )
        );
      }
    );

    this.on("new_bet", (prediction: APIPredictions.EnhancedPrediction) => {
      this.notifySubscribers(
        this.generateResponse<APIPredictions.EnhancedPrediction>(
          "new_bet",
          prediction
        )
      );
    });

    this.on("new_vote", (prediction: APIPredictions.EnhancedPrediction) => {
      this.notifySubscribers(
        this.generateResponse<APIPredictions.EnhancedPrediction>(
          "new_vote",
          prediction
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
      const request = axios
        .post(sub, data, {
          headers: {
            authorization: `Bearer ${process.env.DISCORD_CLIENT_API_KEY}`,
          },
        })
        .catch((err) => {
          console.error("Subscriber webhook request failed: ", sub);
          console.error(err);
        });

      requests.push(request);
    }
  };
}
