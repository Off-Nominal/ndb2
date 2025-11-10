import { eventsManager } from "./events";
import * as API from "@offnominal/ndb2-api-types/v2";

const missionControlWebhookEndpointV2 = process.env.WEBHOOK_DISCORD_BOT + "/v2";

const subscribers: string[] = [];

if (missionControlWebhookEndpointV2) {
  subscribers.push(missionControlWebhookEndpointV2);
}

const generateResponse = <P extends API.Webhooks.Payload>(
  event_name: P["event_name"],
  data: P["data"]
): API.Webhooks.Payload => {
  const response: API.Webhooks.Payload = {
    event_name,
    version: 2,
    date: new Date(),
    data,
  };

  return response;
};

const notifySubscribers = <E extends API.Webhooks.WebhookEvent, D>(
  data: API.Webhooks.BasePayload<E, D>
) => {
  const requests = [];

  for (const sub of subscribers) {
    const request: RequestInit = {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DISCORD_CLIENT_API_KEY}`,
      },
    };

    const promise = fetch(sub, request)
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
      })
      .catch((err) => {
        console.error("Subscriber webhook request failed: ", sub);
        console.error(err);
      });

    requests.push(promise);
  }
};

eventsManager.on("untriggered_prediction", (prediction) => {
  notifySubscribers(generateResponse("untriggered_prediction", { prediction }));
});
