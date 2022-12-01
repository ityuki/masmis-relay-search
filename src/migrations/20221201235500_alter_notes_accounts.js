'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.alterTable('notes_accounts', function(t) {
    t.text('account_id');       
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('notes_accounts', function(t) {
    t.dropColumn('account_id');       
  });
};
