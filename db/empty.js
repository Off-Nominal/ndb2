const dotenv = require("dotenv");
dotenv.config();

const EMPTY_TABLES = `
  TRUNCATE
    votes,
    bets,
    predictions, 
    users
`;

const empty = async (client) => {
  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  return client.query(EMPTY_TABLES);
};

module.exports = empty;
