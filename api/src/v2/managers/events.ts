import { TypedEventEmitter } from "../utils/TypedEventEmitter";
import * as API from "@offnominal/ndb2-api-types/v2";

export interface NDBEvents {
  untriggered_prediction: (
    prediction: API.Entities.Predictions.Prediction
  ) => void;
}

export const eventsManager = new TypedEventEmitter<NDBEvents>();
