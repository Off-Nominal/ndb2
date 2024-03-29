const seed = require("./seed");
const empty = require("./empty");

const pg = require("pg");
const path = require("node:path");
const dotenv = require("dotenv");
dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const { Client } = pg;

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
