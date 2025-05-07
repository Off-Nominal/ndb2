import seed from "./seed";
import empty from "./empty";

import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const reset = async (client) => {
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
  }

  client.end();
};

reset(client);
