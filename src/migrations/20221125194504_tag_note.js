exports.up = function(knex, Promise) {
  
  return knex.schema.hasTable('tag_note').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('tag_note', function(table) {
        table.increments('id').primary();
        table.bigint('tag_id');
        table.bigint('note_id');

        table.index(['note_id'], 'tag_note_idx_note_id');
        table.index(['tag_id'], 'tag_note_idx_tag_id');
        table.index(['note_id','tag_id'], 'tag_note_idx_tag_id_note_id');
      });
    }else{
      return new Error("Table:tag_note is already exists");
    }
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.hasTable('tag_note').then(function(exists) {
    if (exists) {
      return knex.schema.dropTable('tag_note');
    }
  });
};
