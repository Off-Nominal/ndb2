import { eventsManager } from "@domain/events/events-manager";
import { generateResponse, notifySubscribers } from "./utilities";

const missionControlWebhookEndpointV2 = process.env.WEBHOOK_DISCORD_BOT + "/v2";
const discordClientApiKey = process.env.DISCORD_CLIENT_API_KEY;

const subscribers: string[] = [];

if (missionControlWebhookEndpointV2) {
  subscribers.push(missionControlWebhookEndpointV2);
}

eventsManager.on("untriggered_prediction", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("untriggered_prediction", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("triggered_prediction", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("triggered_prediction", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("triggered_snooze_check", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("triggered_snooze_check", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("judged_prediction", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("judged_prediction", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("unjudged_prediction", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("unjudged_prediction", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("retired_prediction", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("retired_prediction", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("new_prediction", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("new_prediction", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("new_bet", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("new_bet", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("new_vote", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("new_vote", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("prediction_edit", (prediction, edited_fields) => {
  notifySubscribers(
    subscribers,
    generateResponse("prediction_edit", { prediction, edited_fields }),
    discordClientApiKey,
  );
});

eventsManager.on("new_snooze_vote", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("new_snooze_vote", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("snoozed_prediction", (prediction) => {
  notifySubscribers(
    subscribers,
    generateResponse("snoozed_prediction", { prediction }),
    discordClientApiKey,
  );
});

eventsManager.on("season_start", (season) => {
  notifySubscribers(
    subscribers,
    generateResponse("season_start", { season }),
    discordClientApiKey,
  );
});

eventsManager.on("season_end", (results) => {
  notifySubscribers(
    subscribers,
    generateResponse("season_end", { results }),
    discordClientApiKey,
  );
});
