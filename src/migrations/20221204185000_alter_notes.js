'use strict';

exports.up = function(knex) {
  return knex.schema.alterTable('notes', function(t) {
    t.text('note_norm');       
  }).then(()=>{
    return knex.raw('create index notes_idx_note_norm on notes using gin (note_norm gin_bigm_ops)');
  }).then(()=>{
    return knex.raw('drop index notes_idx_note');
  }).then(async ()=>{
    var rows = await knex('notes').select().orderBy('id')
    for(var row of rows){
      console.log('note: notes -> note_norm:' + row['id'])
      await knex('notes')
      .where({
        id: row['id']
      })
      .update({
        note_norm: row['note'].normalize('NFKC').toLowerCase()
      })
    } 
    return Promise.resolve()
  })
};

exports.down = function(knex) {
  return knex.raw('drop index notes_idx_note_norm')
  .then(()=>{
    return knex.schema.alterTable('notes', function(t) {
    t.dropColumn('note_norm');
    })
  }).then(()=>{
    return knex.raw('create index notes_idx_note on notes using gin (note gin_bigm_ops)');
  });
};
