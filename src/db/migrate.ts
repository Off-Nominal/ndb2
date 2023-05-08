import dotenv from "dotenv";
import axios from "axios";
import { Client } from "pg";
import { add, isBefore } from "date-fns";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

export const isRejected = <T>(
  p: PromiseSettledResult<T>
): p is PromiseRejectedResult => p.status === "rejected";

const env = process.env.NODE_ENV;

const bot_token = process.env.NDB2_BOT_TOKEN_ID;
const guild_id = process.env.GUILD_ID;
const default_discord_id = process.env.NDB2_BOT_DISCORD_ID;

const db_url =
  env === "production"
    ? process.env.PROD_DATABASE_URL
    : process.env.DATABASE_URL;

const client = new Client({
  connectionString: db_url,
});

const discord_db_url =
  env === "production"
    ? process.env.DISCORD_DB_URL_PROD
    : process.env.DISCORD_DB_URL;

const discordDbClient = new Client({
  connectionString: discord_db_url,
});

const manualUserMap = {
  Nolan: "581693028746526742",
  "Lars Osborne": "168255156956299266",
  benjaminherrin: "576950553289031687",
  sudnadja: "456226577798135808",
  BobbySalsa: "600162692203937802",
  bobbysalsa: "600162692203937802",
  mikee368: "297841040239493120",
  jhnhnck: "237744252141043723",
  NoahPK: "308265447243907072",
  Dek_Lazer: "157638446196850688",
  "Collin aka I-just-want-to-grill": "387990444941901825",
  "Adam - OptimisticMartian": "403396789950087169",
  IvixorC: "315875683773710336",
  Marcema: "329660904671281153",
  vulpes: "435140382439768064",
  bbluech: "322574226726846465",
  obliquity97: "435140382439768064",
  Sofranko: "360071507222724618",
  gem: "215378331133149184",
  mattw: "600162692203937802",
  Acemaster27: "460630063835119628",
  "benjaminherrin (he/him/they)": "576950553289031687",
  MWMjr: "918951434924490833",
  _weihl: "600162692203937802",
  HarryStranger: "616785229381632001",
  marcema: "329660904671281153",
};

const fakeUsersForVotes = [];

for (let i = 0; i < 50; i++) {
  fakeUsersForVotes.push({
    discord_id: i.toString().padStart(16, "0"),
    id: uuidv4(),
  });
}

const baseUrl = "https://deltayeet.net/ndb";
const standing_url = baseUrl + "?standing";
const retired_url = baseUrl + "?retired";
const judged_url = baseUrl + "?judged";
const endorsements_url = baseUrl + "?endorsements";
const undorsements_url = baseUrl + "?undorsements";
const votes_url = baseUrl + "?votes";

type NDBPrediction = {
  user: string;
  type: "standing" | "retired" | "judged";
  date: string;
  due: string;
  text: string;
  announced: "0" | "1";
  judged: "0" | "1";
  channelID: string;
  messageID: string;
  initial_messageID: string;
};

type Endorsement = {
  endorsement_date: string;
  endorsement_user: string;
  prediction_id: string;
};

type Undorsement = {
  undorsement_date: string;
  undorsement_user: string;
  prediction_id: string;
};

type Vote = {
  thumbs_down: string;
  thumbs_up: string;
};

type MappedPrediction = NDBPrediction & { id: number };

type MappedBet = {
  prediction_id: number;
  endorsed: boolean;
  bet_date: string;
  better_name: string;
};

type MappedVoteCount = {
  prediction_id: number;
  yes: number;
  no: number;
};

const fetchData = () => {
  const standingPredictions = axios
    .get<Record<string, NDBPrediction>>(standing_url)
    .then((res) => res.data);
  const retiredPredictions = axios
    .get<Record<string, NDBPrediction>>(retired_url)
    .then((res) => res.data);
  const judgedPredictions = axios
    .get<Record<string, NDBPrediction>>(judged_url)
    .then((res) => res.data);

  const endorsements = axios
    .get<Record<string, Endorsement>>(endorsements_url)
    .then((res) => res.data);
  const undorsements = axios
    .get<Record<string, Undorsement>>(undorsements_url)
    .then((res) => res.data);

  const votes = axios
    .get<Record<string, Vote>>(votes_url)
    .then((res) => res.data);

  return Promise.all([
    standingPredictions,
    retiredPredictions,
    judgedPredictions,
    endorsements,
    undorsements,
    votes,
  ]).then((response) => {
    const predictions: MappedPrediction[] = [];

    for (const id in response[0]) {
      predictions.push({ id: Number(id), ...response[0][id] });
    }
    for (const id in response[1]) {
      predictions.push({ id: Number(id), ...response[1][id] });
    }
    for (const id in response[2]) {
      predictions.push({ id: Number(id), ...response[2][id] });
    }

    const bets: MappedBet[] = [];

    for (const id in response[3]) {
      bets.push({
        prediction_id: Number(response[3][id].prediction_id),
        endorsed: true,
        bet_date: response[3][id]["endorsement_date"],
        better_name: response[3][id]["endorsement_user"],
      });
    }

    for (const id in response[4]) {
      bets.push({
        prediction_id: Number(response[4][id].prediction_id),
        endorsed: false,
        bet_date: response[4][id]["undorsement_date"],
        better_name: response[4][id]["undorsement_user"],
      });
    }

    const voteCounts: MappedVoteCount[] = [];

    for (const id in response[5]) {
      if (
        response[5][id]["thumbs_up"] === "0" &&
        response[5][id]["thumbs_down"] === "0"
      ) {
        continue;
      }
      voteCounts.push({
        prediction_id: Number(id),
        yes: Number(response[5][id]["thumbs_up"]),
        no: Number(response[5][id]["thumbs_down"]),
      });
    }

    const users: string[] = [];

    for (const prediction of predictions) {
      users.push(prediction.user);
    }

    for (const bet of bets) {
      users.push(bet.better_name);
    }

    const filteredUsers = [...new Set(users)];

    const values: [
      string[],
      MappedPrediction[],
      MappedBet[],
      MappedVoteCount[]
    ] = [filteredUsers, predictions, bets, voteCounts];
    return values;
  });
};

const migrateLegacyData = async () => {
  // Fetch Intial Data
  let users: string[];
  let predictions: MappedPrediction[];
  let bets: MappedBet[];
  let voteCounts: MappedVoteCount[];

  try {
    console.log("Fetching data from Legacy NDB API...");

    const initialData = await fetchData();
    users = initialData[0];
    predictions = initialData[1];
    bets = initialData[2];
    voteCounts = initialData[3];

    console.log("API Data retrieved successfully.");
  } catch (err) {
    console.error("Failed to fetch data from Legacy NDB API");
    console.error(err);
    return;
  }

  // Fetch Discord API Data
  let guildMembers: Record<string, string> = {};

  try {
    console.log("Fetching Discord IDs from Discord API...");
    const response = await axios.get(
      `https://discord.com/api/v10/guilds/${guild_id}/members?limit=1000`,
      {
        headers: { Authorization: `Bot ${bot_token}` },
      }
    );
    console.log("API Call successful, Discord Users retrieved");
    console.log("Mapping users to usernames...");
    for (const user of users) {
      const foundUser = response.data.find(
        (member) => member.user.username === user
      );

      const discord_id = foundUser?.user.id || manualUserMap[user] || null;
      guildMembers[user] = discord_id;
    }

    const nullMembers = Object.entries(guildMembers).filter(
      (entry) => entry[1] === null
    );
    console.log(
      `Found ${Object.values(nullMembers).length} null members out of ${
        users.length
      }, shown here:`
    );
    console.table(nullMembers);
  } catch (err) {
    console.error("Failed to fetch user IDs from Discord API");
    console.error(err);
    return;
  }

  await client.connect();
  await client.query("BEGIN");

  // Clear existing data
  const EMPTY_TABLES = `
    TRUNCATE
      seasons,
      votes,
      bets,
      predictions, 
      users
  `;

  try {
    await client.query(EMPTY_TABLES);
    console.log("Tables succesfully truncated");
  } catch (err) {
    console.error("Failed to truncate tables");
    console.error(err);
    await client.query("ROLLBACK");
    return;
  }

  // Add seasons

  const INSERT_SEASON = `INSERT INTO seasons (
    id,
    name, 
    start, 
    "end", 
    payout_formula
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
  )`;

  const seasons = [
    {
      id: 1,
      name: "NDB Legacy",
      start: "2019-01-01T00:00:00Z",
      end: "2023-06-01T00:00:00Z",
      payout_formula: "1",
    },
    {
      id: 2,
      name: "Hermes",
      start: "2023-06-01T00:00:00Z",
      end: "2023-07-01T00:00:00Z",
      payout_formula: "(ln($1/$2/2.0)/1.5)+1",
    },
    {
      id: 3,
      name: "Nova",
      start: "2023-07-01T00:00:00Z",
      end: "2023-10-01T00:00:00Z",
      payout_formula: "(ln($1/$2/2.0)/1.5)+1",
    },
  ];

  const seasonsPromises = [];

  for (const season of seasons) {
    const promise = client.query(INSERT_SEASON, [
      season.id,
      season.name,
      season.start,
      season.end,
      season.payout_formula,
    ]);

    seasonsPromises.push(promise);
  }

  try {
    await Promise.all(seasonsPromises);
  } catch (err) {
    console.error("Failed to add seasons");
    console.error(err);
    await client.query("ROLLBACK");
    return;
  }

  try {
    const SEASON_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('seasons', 'id'), COALESCE((SELECT MAX(id)+1 FROM seasons), 1), false)`;
    await client.query(SEASON_SEQUENCE_RESET);
  } catch (err) {
    console.error("Failed to reset seasons id sequence");
    console.error(err);
    await client.query("ROLLBACK");
    return;
  }

  // Insert users to DB
  const ADD_USER = `
    WITH add_user AS (
      INSERT 
        INTO users (id, discord_id) 
        VALUES ($1, $2) 
      ON CONFLICT (discord_id) DO NOTHING
      RETURNING id, discord_id
    )
    SELECT id, discord_id FROM add_user
    UNION
    SELECT id, discord_id FROM users WHERE discord_id = $2
  `;

  const usersPromises: Promise<{ id: string; discord_id: string }>[] = [];

  for (const username in guildMembers) {
    // For missing users
    if (guildMembers[username] === null) {
      continue;
    }

    usersPromises.push(
      client
        .query<{ id: string; discord_id: string }>(ADD_USER, [
          uuidv4(),
          guildMembers[username],
        ])
        .then((res) => res.rows[0])
        .catch((err) => {
          console.error(err);
          throw err;
        })
    );
  }

  // Insert default user for missing people
  usersPromises.push(
    client
      .query<{ id: string; discord_id: string }>(ADD_USER, [
        uuidv4(),
        default_discord_id,
      ])
      .then((res) => res.rows[0])
      .catch((err) => {
        console.error(err);
        throw err;
      })
  );

  // Insert fake users for votes
  for (const fakeUser of fakeUsersForVotes) {
    usersPromises.push(
      client
        .query<{ id: string; discord_id: string }>(ADD_USER, [
          fakeUser.id,
          fakeUser.discord_id,
        ])
        .then((res) => res.rows[0])
        .catch((err) => {
          console.error(err);
          throw err;
        })
    );
  }

  let defaultUserId: string;

  try {
    const users = await Promise.all(usersPromises);
    console.log(`Successfully upserted ${usersPromises.length} users.`);

    const defaultUser = users.find((u) => u.discord_id === default_discord_id);
    defaultUserId = defaultUser.id;

    for (const username in guildMembers) {
      const foundUser = users.find(
        (u) => u.discord_id === guildMembers[username]
      );
      guildMembers[username] = foundUser?.id || defaultUserId;
    }
  } catch (err) {
    console.error("Failed to insert all users to DB");
    console.error(err);
    await client.query("ROLLBACK");
    return;
  }

  // Create Prediction Seeds
  console.log("building Prediction seeds from legacy data...");

  const untriggeredLegacyPredictions = [];

  const incorrectDueDatePredictions = [];

  const predictionSeeds = predictions.map((p) => {
    const pBets = bets
      .filter(
        (bet) =>
          bet.prediction_id === p.id &&
          bet.better_name !== p.user &&
          guildMembers[bet.better_name] !== defaultUserId
      )
      .map((bet) => {
        return {
          user_id: guildMembers[bet.better_name],
          date: bet.bet_date,
          endorsed: bet.endorsed,
        };
      });
    const voteCount = voteCounts.find((vc) => vc.prediction_id === p.id);
    const pVotes: { user_id: string; voted: string; vote: boolean }[] = [];

    if (voteCount) {
      for (let i = 0; i < Number(voteCount.yes); i++) {
        pVotes.push({
          user_id: fakeUsersForVotes[i].id,
          voted: p.due,
          vote: true,
        });
      }
      for (let i = 0; i < Number(voteCount.no); i++) {
        pVotes.push({
          user_id: fakeUsersForVotes[i + Number(voteCount.yes)].id,
          voted: p.due,
          vote: false,
        });
      }
    }

    // Fallbacks
    const user_id = guildMembers[p.user] || defaultUserId;
    let due_date = p.due;

    // Predictions with no due date are set way in the future, will be cleaned up after deploy
    if (p.due === "0000-00-00 00:00:00") {
      due_date = "2030-01-01";
    }

    // Some predictions have due dates before created date because of a bug. Set these to match so the points calculations are correct
    if (isBefore(new Date(p.due), new Date(p.date))) {
      due_date = p.date;
    }

    // These have no due date and were never triggered
    if (p.due === "0000-00-00 00:00:00" && p.type === "standing") {
      untriggeredLegacyPredictions.push({
        id: p.id,
        due: p.due,
        text: p.text,
        created: p.date,
        user: p.user,
      });
    }

    // These have a due date in the past and were never triggered
    if (isBefore(new Date(p.due), new Date()) && p.type === "standing") {
      untriggeredLegacyPredictions.push({
        id: p.id,
        due: p.due,
        text: p.text,
        created: p.date,
        user: p.user,
      });
    }

    // These have a due date that is before the created date
    if (isBefore(new Date(p.due), new Date(p.date))) {
      incorrectDueDatePredictions.push({
        id: p.id,
        due: p.due,
        text: p.text,
        created: p.date,
        user: p.user,
      });
    }

    return {
      id: p.id,
      user_id,
      text: p.text,
      created_date: p.date,
      due_date,
      retired_date: p.type === "retired" ? p.date : undefined,
      triggered_date: p.type === "judged" ? p.due : undefined,
      closed_date: p.type === "judged" ? p.due : undefined,
      judged_date:
        p.type === "judged" ? add(new Date(p.due), { days: 1 }) : undefined,
      bets: pBets,
      votes: pVotes,
      context_channelId: p.channelID,
      context_messageId: p.initial_messageID,
      judgement_notice_messageId: p.messageID,
    };
  });

  console.log(
    `Found ${untriggeredLegacyPredictions.length} untriggered legacy predictions to be reviewed.`
  );
  console.table(untriggeredLegacyPredictions);

  console.log(
    `Found ${incorrectDueDatePredictions.length} predictions with negative due dates to be reviewed.`
  );
  console.table(incorrectDueDatePredictions);

  // Reset sequences for votes and bets
  try {
    const BET_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('bets', 'id'), COALESCE((SELECT MAX(id)+1 FROM bets), 1), false)`;
    await client.query(BET_SEQUENCE_RESET);
    const VOTE_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('votes', 'id'), COALESCE((SELECT MAX(id)+1 FROM votes), 1), false)`;
    await client.query(VOTE_SEQUENCE_RESET);
    console.log("Successfully reset Bet and Vote ID sequence");
  } catch (err) {
    console.error("Failed to reset sequences for Bets and Votes");
    console.error(err);
    await client.query("ROLLBACK");
    return;
  }

  // Seed db

  const INSERT_PREDICTION = `INSERT INTO predictions (
    id,
    user_id,
    text,
    created_date,
    due_date,
    closed_date,
    retired_date,
    triggered_date,
    judged_date
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

  console.log("Inserting predictions into datbase...");

  const predictionPromises = [];

  const contextEntries: {
    prediction_id: number;
    type: "context" | "judgement_notice";
    channel_id: string;
    message_id: string;
  }[] = [];

  for (const prediction of predictionSeeds) {
    if (prediction.context_messageId !== "0") {
      contextEntries.push({
        prediction_id: prediction.id,
        type: "context",
        channel_id: prediction.context_channelId,
        message_id: prediction.context_messageId,
      });
    }

    if (prediction.judgement_notice_messageId !== "0") {
      contextEntries.push({
        prediction_id: prediction.id,
        type: "judgement_notice",
        channel_id: prediction.context_channelId,
        message_id: prediction.judgement_notice_messageId,
      });
    }

    predictionPromises.push(
      client
        .query(INSERT_PREDICTION, [
          prediction.id,
          prediction.user_id,
          prediction.text,
          prediction.created_date,
          prediction.due_date,
          prediction.closed_date,
          prediction.retired_date,
          prediction.triggered_date,
          prediction.judged_date,
        ])
        .then(() => {
          const betsPromises = [];

          const usersWhoHaveBet = {};

          // Insert predictor's initial bet
          betsPromises.push(
            client
              .query(INSERT_BET, [
                prediction.user_id,
                prediction.id,
                true,
                prediction.created_date,
              ])
              .catch((err) => {
                throw [
                  "Initial Predictor Bet Error\n",
                  [
                    prediction.user_id,
                    prediction.id,
                    true,
                    prediction.created_date,
                  ],
                  err,
                ];
              })
          );

          usersWhoHaveBet[prediction.user_id] = true;

          // Insert other bets
          for (const bet of prediction.bets) {
            if (usersWhoHaveBet[bet.user_id]) {
              continue;
            }

            betsPromises.push(
              client
                .query(INSERT_BET, [
                  bet.user_id,
                  prediction.id,
                  bet.endorsed,
                  bet.date,
                ])
                .catch((err) => {
                  throw [
                    "Subsequent Bet Error\n",
                    [bet.user_id, prediction.id, bet.endorsed, bet.date],
                    err,
                  ];
                })
            );

            usersWhoHaveBet[bet.user_id] = true;
          }

          const votePromises = [];

          // Insert votes if it is a judged prediction
          if (prediction.judged_date) {
            for (const vote of prediction.votes) {
              votePromises.push(
                client.query(INSERT_VOTE, [
                  vote.user_id,
                  prediction.id,
                  vote.vote,
                  vote.voted,
                ])
              );
            }
          }

          return Promise.allSettled([...betsPromises, ...votePromises]).then(
            (responses) => {
              const rejectedPromises = responses.filter(isRejected);

              // throw first error to help troubleshoot
              if (rejectedPromises.length > 0) {
                throw new Error(rejectedPromises[0].reason);
              }
            }
          );
        })
    );
  }

  try {
    const responses = await Promise.allSettled(predictionPromises);
    const rejectedPromises = responses.filter(isRejected);
    if (rejectedPromises.length > 0) {
      console.error(rejectedPromises[0]);
      throw new Error();
    }
    console.log(
      `Successfuly inserted ${predictionPromises.length} predictions.`
    );
    const PREDICTION_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('predictions', 'id'), COALESCE((SELECT MAX(id)+1 FROM predictions), 1), false)`;
    await client.query(PREDICTION_SEQUENCE_RESET);
    console.log("Successfully reset Prediction ID sequence to latest number");
  } catch (err) {
    console.error("Failed to insert all predictions");
    await client.query("ROLLBACK");
    return;
  }

  console.log("Committing.");
  await client.query("COMMIT");

  return contextEntries;
};

migrateLegacyData()
  .then(async (contexts) => {
    discordDbClient.connect();

    discordDbClient.query("BEGIN");

    try {
      console.log("Truncating ndb2_msg_sub table...");
      await discordDbClient.query("TRUNCATE ndb2_msg_subscriptions");
    } catch (err) {
      console.error(
        "Failed to truncate ndb2_msg_subscriptions table, aborting"
      );
      console.error(err);
      discordDbClient.query("ROLLBACK");
      return;
    }

    try {
      const SUB_SEQUENCE_RESET = `SELECT SETVAL(pg_get_serial_sequence('ndb2_msg_subscriptions', 'id'), COALESCE((SELECT MAX(id)+1 FROM ndb2_msg_subscriptions), 1), false)`;
      await discordDbClient.query(SUB_SEQUENCE_RESET);
    } catch (err) {
      console.error("failed to reset id sequence for subs");
      console.error(err);
      discordDbClient.query("ROLLBACK");
      return;
    }

    const ADD_SUB = `INSERT INTO ndb2_msg_subscriptions (type, prediction_id, channel_id, message_id, expiry) VALUES ($1, $2, $3, $4, $5) RETURNING id`;

    const subPromises = [];

    for (const sub of contexts) {
      subPromises.push(
        discordDbClient
          .query(ADD_SUB, [
            sub.type,
            sub.prediction_id,
            sub.channel_id,
            sub.message_id,
            null,
          ])
          .catch((err) => {
            console.error(err);
            throw err;
          })
      );
    }

    return Promise.all(subPromises)
      .then(() => {
        console.log("Successfully added all subscriptions");
        return discordDbClient.query("COMMIT");
      })
      .catch((err) => {
        console.error("failed to submit all subscriptions.");
        return discordDbClient.query("ROLLBACK");
      });
  })
  .finally(() => {
    client.end();
    discordDbClient.end();
  });
