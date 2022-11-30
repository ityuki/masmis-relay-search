exports.up = function(knex, Promise) {
  
  return knex.schema.hasTable('notes').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('notes', function(table) {
        table.increments('id').primary();

        table.bigint('account_id');
        table.text('url');

        table.text('note');

        table.boolean('sensitive');
        table.boolean('media_attachments');
        table.text('language');
        table.text('application_name');
        table.timestamp('note_created_at');

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index(['account_id'], 'notes_idx_account_id');
        table.index(['application_name'], 'notes_idx_application_name');
        table.index(['note_created_at'], 'notes_idx_note_created_at');
      }).then(()=>{
        return knex.raw('create index notes_idx_note on notes using gin (note gin_bigm_ops)');
      })
    }else{
      return new Error("Table:notes is already exists");
    }
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.hasTable('notes').then(function(exists) {
    if (exists) {
      return knex.schema.dropTable('notes');
    }
  });
};
