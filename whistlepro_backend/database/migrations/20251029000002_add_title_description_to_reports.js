/**
 * Migration: Add title and description to reports table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('reports', function(table) {
    table.string('title', 500);
    table.text('description');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('reports', function(table) {
    table.dropColumn('title');
    table.dropColumn('description');
  });
};
