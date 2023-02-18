'use strict';

var rev_domain = require('../utils/rev_domain');

exports.up = function(knex, Promise) {
  return knex.schema.alterTable('notes_domains', function(table) {
    table.text('rev_domain');

    table.index(['rev_domain'], 'notes_domains_idx_rev_domain');
  }).then(async ()=>{
    var rows = await knex('notes_domains').select().orderBy('id')
    for(var row of rows){
      console.log('note: domain -> rev_domain:' + row['id'])
      await knex('notes_domains')
      .where({
        id: row['id']
      })
      .update({
        rev_domain: rev_domain.build(row['domain'].normalize('NFKC').toLowerCase())
      })
    } 
    return;
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('notes_domains', function(t) {
    t.dropColumn('rev_domain');       
  });
};
