import { TypedEventEmitter } from "../libs/TypedEventEmitter";
import { APIPredictions } from "../types/predicitions";

// WIP
type NDBEventPayload<T> = {
  emittedAt: string;
  event: string;
  data: T;
};

const events = {
  new_prediction: (
    payload: NDBEventPayload<APIPredictions.EnhancedPrediction>
  ) => null,
};

class EventManager extends TypedEventEmitter {
  constructor(events) {
    super(events);
  }
}
