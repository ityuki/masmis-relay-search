'use strict';

exports.up = function(knex) {
  return knex.schema.alterTable('notes', function(table) {
    table.binary('data_json');
  })
};

exports.down = function(knex) {
  return knex.schema.alterTable('notes', function(table) {
    table.dropColumn('data_json');       
  });
};
