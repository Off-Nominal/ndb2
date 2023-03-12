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
