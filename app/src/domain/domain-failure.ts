import type * as API from "@offnominal/ndb2-api-types/v2";

/**
 * Domain-layer failure: {@link API.Utils.ErrorInfo} fields plus `ok: false`.
 * Maps cleanly onto v2 JSON (`errors[]`) or web partials; **HTTP status** is chosen only in transports.
 */
export type DomainFailure<
  Code extends API.Utils.ErrorInfo["code"] = API.Utils.ErrorInfo["code"],
> = {
  ok: false;
  code: Code;
  message: string;
};
