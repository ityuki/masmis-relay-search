'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.alterTable('notes', function(t) {
    t.text('note_norm');       
  }).then(()=>{
    return knex.raw('create index notes_idx_note_norm on notes using gin (note_norm gin_bigm_ops)');
  }).then(()=>{
    return knex.raw('drop index notes_idx_note');
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('notes', function(t) {
    t.dropColumn('note_norm');       
  }).then(()=>{
    return knex.raw('create index notes_idx_note on notes using gin (note gin_bigm_ops)');
  }).then(()=>{
    return knex.raw('drop index notes_idx_note_norm');
  });
};
