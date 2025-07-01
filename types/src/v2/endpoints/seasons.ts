import { Entities } from "..";
import { APIResponse } from "../utils";

// GET /seasons/
export namespace GET {
  export type Data = Entities.Seasons.Season[];
  export type Response = APIResponse<Data>;
}
