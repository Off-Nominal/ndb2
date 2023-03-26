const { add, sub } = require("date-fns");

const users = require("./seeds/users.json");
const predictions = require("./seeds/predictions.json");

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
    baseData.push(client.query(INSERT_USER, [user.id, user.discord_id]));
  }

  return Promise.all(baseData)
    .then(([users]) => {
      const referencedData = [];

      const INSERT_PREDICTION = `INSERT INTO predictions (
        id,
        user_id,
        text,
        created_date,
        due_date,
        closed_date,
        retired_date,
        triggered_date,
        judged_date,
        triggerer_id
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      )`;

      const INSERT_BET = `INSERT INTO bets (
        user_id,
        prediction_id,
        endorsed,
        date
      ) VALUES (
        $1, 
        $2, 
        $3, 
        $4
      )`;

      const INSERT_VOTE = `INSERT INTO votes (
        user_id, 
        prediction_id, 
        vote, 
        voted_date
      ) VALUES (
        $1, 
        $2, 
        $3, 
        $4
      )`;

      const now = new Date();

      for (let i = 0; i < predictions.length; i++) {
        const p = predictions[i];

        const created_date = add(now, { hours: p.created });
        const closed_date = p.closed ? add(now, { hours: p.closed }) : null;
        const retired_date = p.retired ? add(now, { hours: p.retired }) : null;
        const triggered_date = p.closed
          ? add(now, { hours: p.triggered })
          : null;
        const judged_date = p.judged ? add(now, { hours: p.judged }) : null;

        referencedData.push(
          client
            .query(INSERT_PREDICTION, [
              p.id,
              p.user_id,
              p.text,
              created_date,
              add(now, { hours: p.due }),
              closed_date,
              retired_date,
              triggered_date,
              judged_date,
              p.triggerer,
            ])
            .then(() => {
              const bets = [];

              // Predictor's original bet
              bets.push(
                client.query(INSERT_BET, [p.user_id, p.id, true, created_date])
              );

              // Additional bets as needed
              if (p.bets) {
                for (const b of p.bets) {
                  bets.push(
                    client.query(INSERT_BET, [
                      b.user_id,
                      p.id,
                      b.endorsed,
                      add(now, { hours: b.created }),
                    ])
                  );
                }
              }

              const votes = [];

              if (p.votes) {
                for (const v of p.votes) {
                  votes.push(
                    client.query(INSERT_VOTE, [
                      v.user_id,
                      p.id,
                      v.vote,
                      add(now, { hours: v.voted }),
                    ])
                  );
                }
              }

              return Promise.all([...bets, ...votes]);
            })
            .catch((err) => console.error(err))
        );
      }

      return Promise.all(referencedData);
    })
    .then(() => {
      const finalData = [];

      const PREDICTION_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('predictions', 'id'), (SELECT MAX(id) FROM predictions))`;
      finalData.push(client.query(PREDICTION_SEQUENCE_RESET));

      const BET_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('bets', 'id'), (SELECT MAX(id) FROM bets))`;
      finalData.push(client.query(BET_SEQUENCE_RESET));

      return Promise.all(finalData);
    });
};

module.exports = seed;
