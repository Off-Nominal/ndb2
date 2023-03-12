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
  return db.createTable("predictions", {
    id: { type: "int", primaryKey: true, notNull: true, autoIncrement: true },
    user_id: {
      type: "uuid",
      notNull: true,
      foreignKey: {
        name: "predictions_user_id_fk",
        table: "users",
        rules: {
          onDelete: "SET NULL",
        },
        mapping: "id",
      },
    },
    text: { type: "text", notNull: true },
    created_date: { type: "timestamp", notNull: true },
    due_date: { type: "timestamp", notNull: true },
    closed_date: { type: "timestamp" },
    judged_date: { type: "date" },
    successful: { type: "boolean" },
  });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
