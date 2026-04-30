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

### Web dashboard (HTML)

The `app` service also serves server-rendered pages from `src/web/routes/` (**`page.tsx`**, **`handler.tsx`**, **`tests/`**, snake_case **`components/`** + colocated **`*.test.ts`**) using **[@kitajs/html](https://github.com/kitajs/html)** (TSX → HTML). There is **no** EJS or Express view engine — see `docs/frontend/overview.md` and `.cursor/skills/kitajs-html-web/SKILL.md`.

### Migrations

To create a new migration, run `npm run db:migrate:create my-migration-description -- --sql-file`.

## Denormalized data (derived columns + triggers)

Columns such as **`bets.wager`**, **`predictions.status`**, **`endorse_ratio`**, and **`bets.payout`** are **materialized** and maintained by PostgreSQL **functions + triggers** so APIs stay fast.

**Canonical inventory** (reconciled with **`db/schema.sql`**): **[`docs/denormalized-data.md`](../docs/denormalized-data.md)**. **[`docs/scoring.md`](../docs/scoring.md)** explains wager/ratio/payout *meaning*; **`denormalized-data.md`** explains *how* columns stay in sync.
