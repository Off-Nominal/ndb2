import reset from "./reset";

import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

reset(client);
