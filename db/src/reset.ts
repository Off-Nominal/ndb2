import seed from "./seed";
import empty from "./empty";
import { Client, PoolClient } from "pg";

export default async (client: Client | PoolClient) => {
  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run db reset in production.");
  }

  try {
    await client.connect();
  } catch (err) {
    console.error(err);
    throw err;
  }

  try {
    await empty(client);
    await seed(client);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
};
