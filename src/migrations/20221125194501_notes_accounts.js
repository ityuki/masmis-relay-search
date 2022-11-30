'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.hasTable('notes_accounts').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('notes_accounts', function(table) {
          table.increments('id').primary();
          table.text('domain');
          table.text('username');
          table.text('display_name');
          table.boolean('bot');

          table.text('url');

          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').defaultTo(knex.fn.now());

          table.index(['domain'], 'notes_accounts_idx_domain');
          table.index(['username'], 'notes_accounts_idx_username');
          table.index(['display_name'], 'notes_accounts_idx_display_name');
          table.index(['url'], 'notes_accounts_idx_url');
        });
      }else{
        return new Error("Table:notes_accounts is already exists");
      }
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.hasTable('notes_accounts').then(function(exists) {
      if (exists) {
        return knex.schema.dropTable('notes_accounts');
      }
    });
};
