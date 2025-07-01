import { Entities } from "..";
import { APIResponse } from "../utils";

// GET /predictions/{prediction_id}/
export namespace GET_ById {
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// DELETE /predictions/{prediction_id}/trigger
export namespace DELETE_ById_trigger {
  export type Data = null;
  export type Response = APIResponse<Data>;
}
