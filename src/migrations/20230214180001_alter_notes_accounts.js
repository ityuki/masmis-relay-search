'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.alterTable('notes_accounts', function(t) {
    t.text('domain_id');
    t.text('account_url');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('notes_accounts', function(t) {
    t.dropColumn('domain_id');       
    t.dropColumn('account_url');       
  });
};
