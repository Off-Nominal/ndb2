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
  return db.addColumn("predictions", "triggerer_id", {
    type: "uuid",
    default: null,
    foreignKey: {
      name: "predictions_triggerer_id_fk",
      table: "users",
      rules: {
        onDelete: "SET NULL",
      },
      mapping: "id",
    },
  });
};

exports.down = function (db) {
  return db.removeColumn("predictions", "triggerer_id");
};

exports._meta = {
  version: 1,
};
