const EMPTY_TABLES = `
  TRUNCATE
    snooze_checks,
    snooze_votes,
    seasons,
    votes,
    bets,
    predictions, 
    users
`;

export default (client) => {
  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  return client.query(EMPTY_TABLES);
};
