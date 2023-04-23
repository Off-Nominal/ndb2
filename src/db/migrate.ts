import dotenv from "dotenv";
import axios from "axios";
import { Client } from "pg";
import { add } from "date-fns";

dotenv.config();

const env = process.env.NODE_ENV;

const bot_token =
  env === "production"
    ? process.env.NDB2_BOT_TOKEN_ID
    : process.env.NDB2_BOT_TOKEN_ID_DEV;
const guild_id =
  env === "production" ? process.env.GUILD_ID : process.env.GUILD_ID_DEV;

const db_url =
  env === "production"
    ? process.env.PROD_DATABASE_URL
    : process.env.DATABASE_URL;

const client = new Client({
  connectionString: db_url,
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
  console.log("Fetching data from Legacy NDB API...");

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
    console.log("API Data retrieved, mapping to arrays.");

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
        prediction_id: Number(id),
        endorsed: true,
        bet_date: response[3][id]["endorsement_date"],
        better_name: response[3][id]["endorsement_user"],
      });
    }

    for (const id in response[4]) {
      bets.push({
        prediction_id: Number(id),
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

    console.log("Data successfully mapped to arrays.");

    const values: [
      string[],
      MappedPrediction[],
      MappedBet[],
      MappedVoteCount[]
    ] = [filteredUsers, predictions, bets, voteCounts];
    return values;
  });
};

const initialData = fetchData().catch((err) => {
  console.error("Failed to fetch data from Legacy NDB API");
  console.error(err);
  throw err;
});

const dataWithUsers = initialData.then(
  ([users, predictions, bets, voteCounts]) => {
    console.log("Fetching Discord IDs from Discord API...");

    return axios
      .get(
        `https://discord.com/api/v10/guilds/${guild_id}/members?limit=1000`,
        {
          headers: { Authorization: `Bot ${bot_token}` },
        }
      )
      .then((response) => {
        console.log("API call to Discord complete, mapping usernames to IDs");

        const guildMembers: Record<string, string> = {};

        for (const user of users) {
          const foundUser = response.data.find(
            (member) => member.user.username === user
          );

          const discord_id = foundUser?.user.id || manualUserMap[user] || null;
          guildMembers[user] = discord_id;
        }

        const values: [
          Record<string, string>,
          MappedPrediction[],
          MappedBet[],
          MappedVoteCount[]
        ] = [guildMembers, predictions, bets, voteCounts];
        return values;
      })
      .catch((err) => {
        console.error("Failed to fetch user IDs");
        console.error(err);
        throw err;
      });
  }
);

const dataWithUserIds = dataWithUsers.then(
  ([guildMembers, predictions, bets, voteCounts]) => {
    // add users if not exist

    const ADD_USER = `
    WITH add_user AS (
      INSERT 
        INTO users (discord_id) 
        VALUES ($1) 
      ON CONFLICT (discord_id) DO NOTHING
      RETURNING id, discord_id
    )
    SELECT id, discord_id FROM add_user
    UNION
    SELECT id, discord_id FROM users WHERE discord_id = $1
  `;

    const usersPromises: Promise<{ id: string; discord_id: string }>[] = [];

    for (const username in guildMembers) {
      // For missing users
      if (!guildMembers[username]) {
        continue;
      }

      usersPromises.push(
        client
          .query<{ id: string; discord_id: string }>(ADD_USER, [
            guildMembers[username],
          ])
          .then((res) => res.rows[0])
      );
    }

    return Promise.all(usersPromises)
      .then((users) => {
        for (const user in guildMembers) {
          const foundUser = users.find(
            (u) => u.discord_id === guildMembers[user]
          );
          guildMembers[user] = foundUser.id;
        }

        const values: [
          Record<string, string>,
          MappedPrediction[],
          MappedBet[],
          MappedVoteCount[]
        ] = [guildMembers, predictions, bets, voteCounts];
        return values;
      })
      .catch((err) => {
        console.error("Failed to add users to DB");
        console.error(err);
        throw err;
      });
  }
);

dataWithUserIds.then(([guildMembers, predictions, bets, voteCounts]) => {
  const predictionSeeds = predictions.map((p) => {
    const pBets = bets
      .filter((bet) => bet.prediction_id === p.id)
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
          user_id: null,
          voted: p.due,
          vote: true,
        });
      }
      for (let i = 0; i < Number(voteCount.no); i++) {
        pVotes.push({
          user_id: null,
          voted: p.due,
          vote: false,
        });
      }
    }

    return {
      user_id: guildMembers[p.user],
      text: p.text,
      created_date: p.date,
      due_date: p.due,
      retired_date: p.type === "retired" ? p.date : undefined,
      triggered_date: p.type === "judged" ? p.due : undefined,
      closed_date: p.type === "judged" ? p.due : undefined,
      judged_date:
        p.type === "judged" ? add(new Date(p.due), { days: 1 }) : undefined,
      bets: pBets,
      votes: pVotes,
    };
  });
});
