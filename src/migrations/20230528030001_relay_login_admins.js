'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.hasTable('relay_login_admins').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('relay_login_admins', function(table) {
          table.increments('id').primary();
          table.text('login_id');

          table.timestamp('created_at').defaultTo(knex.fn.now());

          table.index(['login_id'], 'relay_login_adminss_idx_login_id');
        });
      }else{
        return new Error("Table:relay_login_admins is already exists");
      }
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.hasTable('relay_login_admins').then(function(exists) {
      if (exists) {
        return knex.schema.dropTable('relay_login_admins');
      }
    });
};
