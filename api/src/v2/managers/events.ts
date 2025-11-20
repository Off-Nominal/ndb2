import { TypedEventEmitter } from "@mendahu/utilities";
import * as API from "@offnominal/ndb2-api-types/v2";

/**
 * Events Manager is a typed event emitter which signals game events
 * Generally, these events are intended to signal other systems that something of interest has happened that other players may want to know.
 *
 * These should not be used for internal, technical, system-level events
 *
 */

/**
 * Events that are emitted by the Events Manager
 */
export interface NDBEvents {
  new_prediction: (prediction: API.Entities.Predictions.Prediction) => void;
  untriggered_prediction: (
    prediction: API.Entities.Predictions.Prediction
  ) => void;
  retired_prediction: (prediction: API.Entities.Predictions.Prediction) => void;
}

/**
 * The Events Manager is a singleton instance of the TypedEventEmitter class
 */
export const eventsManager = new TypedEventEmitter<NDBEvents>();
