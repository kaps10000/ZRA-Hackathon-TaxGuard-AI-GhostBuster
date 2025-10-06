/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('reports', function(table) {
    table.increments('id').primary();
    table.string('case_id', 20).unique().notNullable().index();
    table.text('payload_encrypted').notNullable();
    table.string('category', 50);
    table.enum('status', ['pending', 'under_review', 'investigating', 'closed']).defaultTo('pending').index();
    table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    table.text('metadata_hash'); // For blockchain integration
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable().index();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes for common queries
    table.index(['status', 'created_at']);
    table.index(['category', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('reports');
};