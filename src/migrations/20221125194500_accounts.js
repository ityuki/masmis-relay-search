'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.hasTable('accounts').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('accounts', function(table) {
          table.increments('id').primary();
          table.text('username');
          table.text('domain');
          table.text('private_key');
          table.text('public_key');

          table.text('display_name');
          table.text('note');
          table.text('uri');
          table.text('url');
          table.text('avatar_remote_url');
          table.text('header_remote_url');

          table.text('inbox_url');
          table.text('outbox_url');
          table.text('shared_inbox_url');
          table.text('shared_outbox_url');
          table.text('followers_url');
          table.text('following_url');

          table.text('actor_type');
          table.boolean('discoverable');

          table.text('account_type');
          table.bigint('account_status');

          table.binary('data_json');

          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').defaultTo(knex.fn.now());

          table.index(['domain','account_type','username'], 'accounts_idx_domain_account_type_username');
          table.index(['account_type','account_status'], 'accounts_idx_account_type_account_status');
          table.index(['url'], 'accounts_idx_url');
        });
      }else{
        return new Error("Table:accounts is already exists");
      }
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.hasTable('accounts').then(function(exists) {
      if (exists) {
        return knex.schema.dropTable('accounts');
      }
    });
};
