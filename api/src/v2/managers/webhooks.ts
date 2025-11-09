import { eventsManager, NDBEvents } from "./events";

const discordBot = process.env.WEBHOOK_DISCORD_BOT;

const subscribers: string[] = [];

if (discordBot) {
  subscribers.push(discordBot);
}

type WebhookNotification<T> = {
  event_name: keyof NDBEvents;
  version: 2;
  date: Date;
  data: T;
};

const generateResponse = <T>(event_name: keyof NDBEvents, data: T) => {
  const response: WebhookNotification<T> = {
    event_name,
    version: 2,
    date: new Date(),
    data,
  };

  return response;
};

const notifySubscribers = <K>(data: WebhookNotification<K>) => {
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
  notifySubscribers(generateResponse("untriggered_prediction", prediction));
});
