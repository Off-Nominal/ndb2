import { Entities } from "..";
import { APIResponse } from "../utils";

// GET /seasons/
export namespace GET {
  export type Data = Entities.Seasons.Season[];
  export type Response = APIResponse<Data>;
}

// GET /seasons/:id (positive integer id or path lookup current | last)
export namespace GET_ById {
  export type Data = Entities.Seasons.SeasonDetail;
  export type Response = APIResponse<Data>;
}
