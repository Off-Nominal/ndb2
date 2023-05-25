import dotenv from "dotenv";
import { Client, QueryResult } from "pg";
// import delta_bets from "./delta_bets.json";
import { isBefore } from "date-fns";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

const env = process.env.NODE_ENV;
console.log(env);

const db_url =
  env === "production"
    ? process.env.PROD_DATABASE_URL
    : process.env.DATABASE_URL;

const client = new Client({
  connectionString: db_url,
  ssl: { rejectUnauthorized: false },
});

type NDB1Bet = {
  username: string;
  authorID: string;
  timestamp: string;
};

type NDB2Bet = {
  discord_id: string;
  date: string;
  prediction_id: string;
  endorsed: boolean;
};

const convertBet = (
  bet: NDB1Bet,
  predictionId,
  endorsed: boolean
): NDB2Bet => ({
  discord_id: bet.authorID,
  date: bet.timestamp,
  prediction_id: predictionId,
  endorsed,
});

const predictions: {
  prediction: string;
  endorsements?: NDB1Bet[];
  undorsements?: NDB1Bet[];
}[] = Object.values(delta_bets);

const newBets: NDB2Bet[] = [];

for (const pred of predictions) {
  const prediction_id = pred.prediction;

  const betCache: Record<string, NDB2Bet> = {};

  const endorsements = pred.endorsements || [];
  const undorsements = pred.undorsements || [];

  for (const bet of endorsements) {
    if (
      betCache[bet.authorID] &&
      isBefore(new Date(betCache[bet.authorID].date), new Date(bet.timestamp))
    ) {
      continue;
    }

    betCache[bet.authorID] = convertBet(bet, prediction_id, true);
  }

  for (const bet of undorsements) {
    if (
      betCache[bet.authorID] &&
      isBefore(new Date(betCache[bet.authorID].date), new Date(bet.timestamp))
    ) {
      continue;
    }

    betCache[bet.authorID] = convertBet(bet, prediction_id, false);
  }

  for (const convertedBet of Object.values(betCache)) {
    newBets.push(convertedBet);
  }
}

const GET_ALL_USERS = `SELECT id, discord_id FROM users;`;

const INSERT_USER = `INSERT INTO users (id, discord_id) VALUES ($1, $2) ON CONFLICT (discord_id) DO NOTHING RETURNING id, discord_id;`;

const INSERT_BET = `
  INSERT INTO bets (
    user_id,
    prediction_id,
    date,
    endorsed
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  )
  ON CONFLICT (user_id, prediction_id) WHERE date > $3 DO UPDATE SET
    date = EXCLUDED.date,
    endorsed = EXCLUDED.endorsed
  RETURNING id, prediction_id, user_id, date, endorsed;
`;

const getUsers = () => {
  console.log("Fetching existing Users...");
  return client
    .query(GET_ALL_USERS)
    .then((res) => {
      const idCache: Record<string, string> = {};

      console.log(`Found ${res.rows.length} existing users. Caching.`);

      for (const row of res.rows) {
        idCache[row.discord_id] = row.id;
      }

      return idCache;
    })
    .then((users) => {
      const betDiscordIds = newBets.map((bet) => bet.discord_id);

      const missingUsers = new Set(
        betDiscordIds.filter((discordId) => !users[discordId])
      );

      console.log(`Found ${missingUsers.size} missing users. Inserting...`);

      const promises = [];
      for (const discordId of missingUsers) {
        const uuid = uuidv4();
        users[discordId] = uuid;
        console.log("Added user", uuid, discordId);
        promises.push(client.query(INSERT_USER, [uuid, discordId]));
      }
      return Promise.all(promises).then(() => users);
    });
};

const migrate = (users: Record<string, string> = {}) => {
  console.log(`${newBets.length} bets to insert...`);

  const promisesFilled = new Promise(
    (
      resolve: (value: Promise<QueryResult<any>>[]) => void,
      reject: (reason?: any) => void
    ) => {
      const promises: Promise<QueryResult<any>>[] = [];

      for (let i = 0; i < newBets.length; i++) {
        const bet = newBets[i];

        setTimeout(() => {
          if (users[bet.discord_id] === null) {
            console.log(`User ${bet.discord_id} not found.`);
            reject("WOMP");
          }
          const promise = client
            .query(INSERT_BET, [
              users[bet.discord_id],
              bet.prediction_id,
              bet.date,
              bet.endorsed,
            ])
            .then((res) => {
              console.log(`Inserted Bet #${i + 1} of ${newBets.length} bets`);
              return res;
            });

          promises.push(promise);

          if (i === newBets.length - 1) {
            resolve(promises);
          }
        }, i * 75);
      }
    }
  );

  return promisesFilled.then((ps) => Promise.all(ps));
};

const REFRESH_WAGER = `
UPDATE bets b
  SET wager = 
    (SELECT 
      COALESCE(
        NULLIF(
          EXTRACT(
            DAY FROM
              COALESCE(p.closed_date, p.due_date) - b.date
          ),
          0
        ),
        1
      )
    )::INT
  FROM predictions p
  WHERE p.id = b.prediction_id;`;

const REFRESH_PAYOUT_AND_VALIDITY = `
UPDATE bets
  SET 
    valid = COALESCE(bets.date < ep.closed_date, TRUE),
    payout = 
      (CASE
        WHEN ep.status = 'open' THEN NULL
        WHEN ep.status = 'retired' THEN NULL
        WHEN bets.date >= ep.closed_date THEN NULL
        WHEN ep.status = 'closed' THEN NULL
        ELSE COALESCE(
            NULLIF(
              FLOOR(
                bets.wager *
                (CASE
                  WHEN ep.status = 'successful'
                    THEN ep.endorsement_ratio
                    ELSE ep.undorsement_ratio
                END)
              ), 0
            ), 1
          ) *
          (CASE
            WHEN 
              (ep.status = 'successful' AND bets.endorsed IS TRUE) OR 
              (ep.status = 'failed' AND bets.endorsed IS FALSE)
            THEN 1
            ELSE -1
          END)
        END)
  FROM enhanced_predictions ep
  WHERE bets.prediction_id = ep.prediction_id;`;

client
  .connect()
  .then(() => {
    console.log("Client connected, fetching users");
    return getUsers();
  })
  .then((users) => {
    console.log("Users fetched, beginning transaction");
    return client.query("BEGIN").then(() => users);
  })
  .then((users) => {
    console.table(users);
    console.log("Transaction started, starting bet migration");
    return migrate(users);
  })
  .then(() => {
    console.log("Bets inserted, refreshing wagers");
    return client.query(REFRESH_WAGER);
  })
  .then(() => {
    console.log("Wagers refreshed, refreshing payouts and validity");
    return client.query(REFRESH_PAYOUT_AND_VALIDITY);
  })
  .then(() => {
    return client.query("COMMIT;");
  })
  .then(() => {
    client.end();
    console.log("Migration complete.");
  })
  .catch((err) => {
    console.error(err);
  });
