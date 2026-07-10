import { config } from "@config";
import type * as API from "@offnominal/ndb2-api-types/v2";
import { generateResponse, notifySubscribers } from "./utilities";

function missionControlSubscriberUrls(): string[] {
  const base = config.webhooks.missionControlBaseUrl;
  if (!base) {
    return [];
  }
  const trimmed = base.replace(/\/+$/, "");
  return [`${trimmed}/v2`];
}

/** POST `season_end` webhook payload to Mission Control subscribers. */
export function notifySeasonEndWebhook(
  results: API.Entities.Seasons.SeasonResults,
): void {
  notifySubscribers(
    missionControlSubscriberUrls(),
    generateResponse("season_end", { results }),
    config.api.discordClientApiKey,
  );
}
