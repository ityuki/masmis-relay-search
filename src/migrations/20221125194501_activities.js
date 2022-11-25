exports.up = function(knex, Promise) {
  
  return knex.schema.hasTable('activities').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('activities', function(table) {
        table.increments('id').primary();
        table.text('act_id');
        table.text('type');

        table.binary('data_json');

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index(['act_id'], 'activities_idx_act_id');
      });
    }else{
      return new Error("Table:activities is already exists");
    }
  });
};

exports.down = function(knex, Promise) {

  return knex.schema.hasTable('activities').then(function(exists) {
    if (exists) {
      return knex.schema.dropTable('activities');
    }
  });
};
