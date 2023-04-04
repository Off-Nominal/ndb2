# Nostradambot 2 API

## Environments

### Dev

Create a database in your local postgres installation and set variables from `.env.example` to a local copy of `.env`.

To set up the database, run the database migration script `npm run migrate:up`

## Migrations

To create a new migration, run `npm run migrate:create my-migration-description`.

### Data Types

The following data type keyes can be used.

```js
module.exports = {
  CHAR: "char",
  STRING: "string",
  TEXT: "text",
  SMALLINT: "smallint",
  BIGINT: "bigint",
  INTEGER: "int",
  SMALL_INTEGER: "smallint",
  BIG_INTEGER: "bigint",
  REAL: "real",
  DATE: "date",
  DATE_TIME: "datetime",
  TIME: "time",
  BLOB: "blob",
  TIMESTAMP: "timestamp",
  BINARY: "binary",
  BOOLEAN: "boolean",
  DECIMAL: "decimal",
};
```

## Score Views Worksheet

- `/predict score ["all time", "last season", "this season"]` - get my short score
- `/predict leaderboard ["all time", "last season", "this season"] ["points", "predictions", "bets"]` - get short leaderboard

- `/api/users/discord_id/:discord_id/scores` - all time short score
- `/api/users/discord_id/:discord_id/scores/seasons/:season_id` - season short score
- `/api/scores?view=points` - all time short leaderboard, points/predictions/bets
- `/api/scores/seasons/:season_id?view=points` - season short leaderboard points/predictions/bets

### Short Score

```json
{
  "discord_id": "123456789",
  "season": {
    // omitted for all time scores
    "id": 1,
    "name": "Falcon",
    "start": "2023-07-01T00:00:00Z",
    "end": "2023-10-01T00:00:00Z"
  },
  "points": {
    "total": 3413,
    "ranking": 3
  },
  "predictions": {
    "total": 18,
    "correct": 12,
    "incorrect": 6,
    "ranking": 5 // ranking based on total correct
  },
  "bets": {
    "total": 31,
    "correct": 18,
    "incorrect": 13,
    "ranking": 2 // ranking based on total correct
  },
  "votes": {
    "sycophantic": 6,
    "contrarian": 3,
    "pending": 4
  }
}
```

### Short Leaderboard

Short leaderboard formats are for quick views of rankings. Three views would exist - points, predictions, and bets.

```json
{
  "type": "points", // or predictions or bets
  "season": {
    // omitted for all time scores
    "id": 1,
    "name": "Falcon",
    "start_date": "2023-07-01T00:00:00Z",
    "start_date": "2023-10-01T00:00:00Z"
  },
  "leaders": [
    {
      "id": "ac5ad4e9-3b48-43b4-995c-48b0842b0e4c",
      "discord_id": "123456789",
      "ranking": 1,
      "points": 3081, // for points view
      "predictions": {
        // for predictions view
        "successful": 8,
        "unsuccessful": 4,
        "total": 12
      },
      "bets": {
        // for bets view
        "successful": 14,
        "unsuccessful": 12,
        "total": 26
      }
    } // up to ten leaders in a query
  ]
}
```
