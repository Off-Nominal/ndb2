const uuid = require("uuid");
const uuidv4 = uuid.v4;

const users = require("./seeds/users.json");

const seed = (client) => {
  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  const baseData = [];

  const INSERT_USER = `INSERT INTO users (
    id,
    discord_id
  ) VALUES (
    $1,
    $2
  )`;

  for (const user of users) {
    baseData.push(client.query(INSERT_USER, [uuidv4(), user.discord_id]));
  }

  const PREDICTION_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('predictions', 'id'), (SELECT MAX(id) FROM predictions))`;
  baseData.push(client.query(PREDICTION_SEQUENCE_RESET));

  const BET_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('bets', 'id'), (SELECT MAX(id) FROM bets))`;
  baseData.push(client.query(BET_SEQUENCE_RESET));

  return Promise.all(baseData);
};

module.exports = seed;
