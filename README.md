# Nostradambot 2 API

## Project Setup

1. Clone this repository
2. `npm install`
3. Create a development `postgres` database in your development environment using the names and credentials of your choice
4. Setup your environment variables according to the `.env.example` file (see below)
5. Run `npm run migrate:up` to bring your dev database up to speed
6. Run `npm run db:reset` to seed your database with some sample data
7. Run `npm run dev` to start the development environment

### Environment Variables

Create a database in your local postgres installation and set variables from `.env.example` to a local copy of `.env`.

Many variables are preloaded with default configurations, but you'll need to add some:

1. `DATABASE_URL` should be your fully qualified postgres database url, such as `postgresql://username:password@domain:port/databasename`
2. `DISCORD_CLIENT_API_KEY` should be a high entroy randomly generated key to allow clients to connect to your development environment. Whether you are building the Discord bot or the Web Portal, this key should match across those platforms.
3. `WEBHOOK_DISCORD_BOT` is a receiving URL for webhooks, should you need to work with those. This API sends data to it when events happen to the data. It is designed for use with the Discord Bot and not the web portal.

## Developing for NDB2 API

### Migrations

To create a new migration, run `npm run db:migrate:create my-migration-description -- --sql-file`.

## Denormalized Data

This database makes use of denormalized data to reduce query times. The core tables (season, predictions, users, bets, and votes) are often aggregated together and compared (sometimes all five) which can make nested loops and conditional for counts that drive queries into unacceptable response times.

All denormalized data in this DB are managed using Postgres Triggers and Functions to ensure consistency. This can become difficult to keep track of.

This README aims to keep a running list of denormalized data and the functions which update them for database planning.

### LEVEL 1 Denormalized Data

These data are triggered to change directly as a result of normalized data. Core data changes trigger them.

- `predictions.status`
  - `refresh_prediction_status()` is called to refresh one prediction's status on INSERT or UPDATE (retired_date, closed_date, judged_date) on predictions
- `predictions.season_id`
  - `refresh_prediction_seasons('prediction')` is called to refresh one prediction's season_id on INSERT or UPDATE (due_date, closed_date) on predictions
  - `refresh_prediction_seasons('all)` is called to refresh all predictions' season_ids on INSERT, DELETE or UPDATE (start, "end") on seasons
- `predictions.season_applicable`
  - `refresh_prediction_season_applicable()` is called to refresh one prediction's season_applicable ON UPDATE (season_id) on predictions
- `bets.wager`
  - `refresh_wager('prediction')` is called to update all bets for single prediction on UPDATE (due_date, closed_date) to `predictions` table
  - `refresh_wager('bet')` is called to update a single bet on INSERT to `bets` table
- `bets.valid`
  - `refresh_valid('prediction')` is called to update all bets for single prediction on UPDATE (closed_date) to `predictions` table
  - `refresh_valid('bet')` is called to update single bet on UPDATE (date) to `bets` table
- `seasons.wager_cap`
  - `refresh_wager_cap` is called to update the wager cap on a single season on INSERT or UPDATE (start, 'end') on seasons;

### LEVEL 2 Denormalized Data

These data are triggered to change as a result of Level 1 De-normalized data. Core data changes may trigger them as well.

- `predicitions.endorse_ratio` and `predictions.undorse_ratio`
  - `refresh_prediction_ratios_from_bet` is called to refresh both of these ratios on UPDATE (wager, valid, endorsed) of bets
  - `refresh_prediction_ratios_from_season` is called to refresh both of these ratios on UPDATE (payout_formula) of seasons
  - `refresh_prediction_ratios_from_prediction` is called to refresh both of these ratios on UPDATE (season_id) of predictions

### LEVEL 3 Denormalized Data

These data are triggered to change as a result of LEvel 2 De-normalized data. Core data changes may trigger them as well.

- `bets.payout` and `bets.season_payout`
  - `refresh_payouts_from_season` is called to refresh both of these payouts on UPDATE (payout_formula, wager_cap) of seasons
  - `refresh_payouts_from_prediction` is called to refresh both of these payouts on UPDATE (status, endorse_ratio, undorse_ratio) of predictions!
