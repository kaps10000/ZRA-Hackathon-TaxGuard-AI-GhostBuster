/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('investigators', function(table) {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 255).notNullable();
    table.string('badge_number', 50).unique();
    table.enum('role', ['investigator', 'senior_investigator', 'supervisor', 'admin']).defaultTo('investigator').index();
    table.enum('department', ['tax_evasion', 'fraud', 'compliance', 'general']).defaultTo('general');
    table.boolean('is_active').defaultTo(true).notNullable().index();
    table.timestamp('last_login');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['email', 'is_active']);
    table.index(['role', 'is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('investigators');
};