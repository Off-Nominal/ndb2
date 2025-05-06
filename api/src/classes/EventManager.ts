import API from "@offnominal/ndb2-api-types/v2";
import EventEmitter from "node:events";
import TypedEmitter from "typed-emitter";

// The EventManager is the master class that montiors events,
// including user actions and server actions, on the API.
// It can be subscribed to by any service that needs to act on Events.

// Currently supported events:
type NDBEvents = {
  untriggered_prediction: (
    prediction: API.Entities.Predictions.Prediction
  ) => void;
};

export const EventManager = new EventEmitter() as TypedEmitter<NDBEvents>;
