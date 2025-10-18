/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.increments('id').primary();
    table.integer('actor_id').nullable(); // null for anonymous actions
    table.string('actor_type', 50).notNullable(); // 'investigator', 'anonymous', 'system'
    table.string('action', 100).notNullable(); // 'report_created', 'report_viewed', 'status_changed', etc.
    table.string('target_type', 50).notNullable(); // 'report', 'investigator', etc.
    table.integer('target_id').nullable();
    table.string('ip_hash', 64); // Hashed IP for security
    table.text('user_agent_hash'); // Hashed user agent
    table.json('metadata'); // Additional context data
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    
    // Foreign key constraints
    table.foreign('actor_id').references('id').inTable('investigators').onDelete('SET NULL');
    
    // Indexes for common audit queries
    table.index(['actor_id', 'created_at']);
    table.index(['action', 'created_at']);
    table.index(['target_type', 'target_id']);
    table.index(['created_at']); // For time-based queries
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};