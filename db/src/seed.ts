import { add } from "date-fns";

import users from "./seeds/users.json";
import predictions from "./seeds/predictions.json";
import seasons from "./seeds/seasons.json";

export default (client) => {
  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  const resetIdData = [];

  const PREDICTION_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('predictions', 'id'), COALESCE((SELECT MAX(id)+1 FROM predictions), 1), false)`;
  resetIdData.push(client.query(PREDICTION_SEQUENCE_RESET));

  const BET_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('bets', 'id'), COALESCE((SELECT MAX(id)+1 FROM bets), 1), false)`;
  resetIdData.push(client.query(BET_SEQUENCE_RESET));

  const VOTE_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('votes', 'id'), COALESCE((SELECT MAX(id)+1 FROM votes), 1), false)`;
  resetIdData.push(client.query(VOTE_SEQUENCE_RESET));

  const SEASON_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('seasons', 'id'), COALESCE((SELECT MAX(id)+1 FROM seasons), 1), false)`;
  resetIdData.push(client.query(SEASON_SEQUENCE_RESET));

  return Promise.all(resetIdData)
    .then(() => {
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

      const INSERT_SEASON = `INSERT INTO seasons (
        name, 
        start, 
        "end", 
        payout_formula
      ) VALUES (
        $1,
        $2,
        $3,
        $4
      )`;

      for (const season of seasons) {
        const promise = client.query(INSERT_SEASON, [
          season.name,
          season.start,
          season.end,
          season.payout_formula,
        ]);

        baseData.push(promise);
      }

      return Promise.all(baseData);
    })
    .then(() => {
      const referencedData = [];

      const INSERT_PREDICTION = `INSERT INTO predictions (
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
        $9
      ) RETURNING id`;

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
            .then((response) => {
              const { id } = response.rows[0];
              const bets = [];

              // Predictor's original bet
              bets.push(
                client.query(INSERT_BET, [p.user_id, id, true, created_date])
              );

              // Additional bets as needed
              if (p.bets) {
                for (const b of p.bets) {
                  bets.push(
                    client.query(INSERT_BET, [
                      b.user_id,
                      id,
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
                      id,
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
    });
};
