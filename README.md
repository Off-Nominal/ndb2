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

To create a new migration, run `npm run migrate:create my-migration-description`.
