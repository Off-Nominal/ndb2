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
  return db.createTable("seasons", {
    id: { type: "int", primaryKey: true, notNull: true, autoIncrement: true },
    name: { type: "text", notNull: true },
    start: { type: "timestamptz", notNull: true },
    end: { type: "timestamptz", notNull: true },
    payout_formula: { type: "text", notNull: true },
  });
};

exports.down = function (db) {
  return db.dropTable("seasons");
};

exports._meta = {
  version: 1,
};
