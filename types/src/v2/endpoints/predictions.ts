import { Entities } from "..";
import { APIResponse } from "../utils";

// GET /predictions/{prediction_id}/
export namespace GET_ById {
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// DELETE /predictions/{prediction_id}/trigger
export namespace DELETE_ById_trigger {
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// PATCH /predictions/{prediction_id}/retire
export namespace PATCH_ById_retire {
  export type Body = {
    discord_id: string;
  };
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}

// POST /predictions - Add New Prediction
export namespace POST_Predictions {
  export type Body =
    | {
        text: string;
        discord_id: string;
        check_date: string;
        driver: "event";
      }
    | {
        text: string;
        discord_id: string;
        due_date: string;
        driver: "date";
      };
  export type Data = Entities.Predictions.Prediction;
  export type Response = APIResponse<Data>;
}
