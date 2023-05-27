'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.hasTable('relay_login_accounts').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('relay_login_accounts', function(table) {
          table.increments('id').primary();
          table.text('login_id');
          table.text('login_pass_salted');

          table.timestamp('created_at').defaultTo(knex.fn.now());

          table.index(['login_id'], 'relay_login_accounts_idx_login_id');
        });
      }else{
        return new Error("Table:relay_login_accounts is already exists");
      }
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.hasTable('relay_login_accounts').then(function(exists) {
      if (exists) {
        return knex.schema.dropTable('relay_login_accounts');
      }
    });
};
