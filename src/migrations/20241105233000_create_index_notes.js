'use strict';

exports.up = function(knex) {
  return knex.raw('create index notes_idx_url on notes(url)');
  /*
  return knex.table('notes', function (table) {
    table.index(['url'], 'notes_idx_url');
  });
  */
};

exports.down = function(knex) {
  return knex.raw('drop index notes_idx_url');
  /*
  return knex.table('notes', function (table) {
    table.dropIndex(['url'], 'notes_idx_url');
  });
  */
};
