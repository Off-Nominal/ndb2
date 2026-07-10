import type { PoolClient } from "pg";
import * as API from "@offnominal/ndb2-api-types/v2";
import seasonsV2 from "@data/queries/seasons";
import type { DomainFailure } from "@domain/domain-failure";
import { notifySeasonEndWebhook } from "@domain/webhooks/notify-season-end-webhook";

export type ResendSeasonEndWebhookErrorCode =
  | typeof API.Errors.SEASON_NOT_FOUND
  | typeof API.Errors.MALFORMED_BODY_DATA;

export type ResendSeasonEndWebhookSuccess = {
  ok: true;
  season_id: number;
  season_name: string;
};

export type ResendSeasonEndWebhookFailure =
  DomainFailure<ResendSeasonEndWebhookErrorCode>;

export type ResendSeasonEndWebhookResult =
  | ResendSeasonEndWebhookSuccess
  | ResendSeasonEndWebhookFailure;

export type ResendSeasonEndWebhookInput = {
  season_id: number;
};

/** Re-send the season_end webhook for a past closed season (no close, no event bus emit). */
export async function resendSeasonEndWebhook(
  dbClient: PoolClient,
  input: ResendSeasonEndWebhookInput,
): Promise<ResendSeasonEndWebhookResult> {
  const season = await seasonsV2.getById(dbClient)(input.season_id);
  if (!season) {
    return {
      ok: false,
      code: API.Errors.SEASON_NOT_FOUND,
      message: `Season ${input.season_id} was not found.`,
    };
  }

  if (!season.closed || season.identifier !== "past") {
    return {
      ok: false,
      code: API.Errors.MALFORMED_BODY_DATA,
      message: "Only past closed seasons can have their end webhook re-sent.",
    };
  }

  const results = await seasonsV2.getResultsById(dbClient)(input.season_id);
  if (!results) {
    return {
      ok: false,
      code: API.Errors.SEASON_NOT_FOUND,
      message: `No results found for season ${input.season_id}.`,
    };
  }

  notifySeasonEndWebhook(results);

  return {
    ok: true,
    season_id: input.season_id,
    season_name: results.season.name,
  };
}
