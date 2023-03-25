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
  return db.createTable("votes", {
    id: { type: "int", primaryKey: true, notNull: true, autoIncrement: true },
    user_id: {
      type: "uuid",
      notNull: true,
      foreignKey: {
        name: "votes_user_id_fk",
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
        name: "votes_prediction_id_fk",
        table: "predictions",
        rules: {
          onDelete: "SET NULL",
        },
        mapping: "id",
      },
    },
    vote: { type: "boolean", notNull: true },
    voted_date: { type: "timestamptz", notNull: true },
  });
};

exports.down = function (db) {
  return db.dropTable("votes");
};

exports._meta = {
  version: 1,
};
