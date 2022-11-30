exports.up = function(knex, Promise) {
  
  return knex.schema.hasTable('tags').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('tags', function(table) {
        table.increments('id').primary();
        table.text('name');
        table.text('url');
        table.text('type');

        table.binary('data_json');

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index(['name'], 'tags_idx_name');
      });
    }else{
      return new Error("Table:tags is already exists");
    }
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.hasTable('tags').then(function(exists) {
    if (exists) {
      return knex.schema.dropTable('tags');
    }
  });
};
