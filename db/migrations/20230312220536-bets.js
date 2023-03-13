"use strict";

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.createTable("bets", {
    id: { type: "int", primaryKey: true, notNull: true, autoIncrement: true },
    user_id: {
      type: "uuid",
      notNull: true,
      foreignKey: {
        name: "bets_user_id_fk",
        table: "users",
        rules: {
          onDelete: "SET NULL",
        },
        mapping: "id",
      },
    },
    prediction_id: {
      type: "int",
      notNull: true,
      foreignKey: {
        name: "bets_prediction_id_fk",
        table: "predictions",
        rules: {
          onDelete: "SET NULL",
        },
        mapping: "id",
      },
    },
    date: { type: "timestamptz", notNull: true },
    endorsed: { type: "boolean", notNull: true },
  });
};

exports.down = function (db) {
  return db.dropTable("bets");
};

exports._meta = {
  version: 1,
};
