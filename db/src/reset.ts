import seed from "./seed";
import empty from "./empty";
import { Client, PoolClient } from "pg";

interface ResetOptions {
  verbose?: boolean;
}

export default async (
  client: Client | PoolClient,
  options: ResetOptions = {}
) => {
  const { verbose = false } = options;

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
    await empty(client, { verbose });
    await seed(client, { verbose });
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
};
