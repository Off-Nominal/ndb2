import * as API from "@offnominal/ndb2-api-types/v2";

export const generateResponse = <P extends API.Webhooks.Payload>(
  event_name: P["event_name"],
  data: P["data"],
): P => {
  return {
    event_name,
    version: 2,
    date: new Date(),
    data,
  } as P;
};

export const notifySubscribers = (
  subscriberUrls: readonly string[],
  data: API.Webhooks.Payload,
  apiKey: string | undefined,
) => {
  const requests = [];

  for (const sub of subscriberUrls) {
    const request: RequestInit = {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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

