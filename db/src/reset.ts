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
    throw new Error("Cannot run db reset in production.");
  }

  await client.connect();

  try {
    await empty(client, { verbose });
    await seed(client, { verbose });
    await client.end();
  } catch (err) {
    await client.end();
    throw err;
  }
};
