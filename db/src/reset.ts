import seed from "./seed";
import empty from "./empty";
import { Client, PoolClient } from "pg";

export default async (client: Client | PoolClient) => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cannot run db reset in production.");
  }

  await client.connect();

  try {
    await empty(client);
    await seed(client);
    await client.end();
  } catch (err) {
    await client.end();
    throw err;
  }
};
