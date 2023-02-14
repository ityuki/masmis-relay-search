'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.hasTable('notes_domains').then(function(exists) {
      if (!exists) {
        return knex.schema.createTable('notes_domains', function(table) {
          table.increments('id').primary();
          table.text('domain');
          table.text('domain_name');
          table.text('icon_url');
          table.text('background_color');

          table.timestamp('created_at').defaultTo(knex.fn.now());
          table.timestamp('updated_at').defaultTo(knex.fn.now());

          table.index(['domain'], 'notes_domains_idx_domain');
        });
      }else{
        return new Error("Table:notes_domains is already exists");
      }
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.hasTable('notes_domains').then(function(exists) {
      if (exists) {
        return knex.schema.dropTable('notes_domains');
      }
    });
};
