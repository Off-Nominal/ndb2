import { Entities } from "..";
import { APIResponse } from "../utils";

// GET /predictions/{prediction_id}/
export namespace GET {
  export type Data = Entities.Seasons.Season;
  export type Response = APIResponse<ThisType<Data>>;
}
