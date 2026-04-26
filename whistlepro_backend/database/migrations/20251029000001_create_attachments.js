/**
 * Migration: Create attachments table for file uploads
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('attachments', function(table) {
    table.increments('id').primary();
    table.string('file_id', 50).unique().notNullable().index();
    table.integer('report_id').unsigned().nullable();
    table.string('original_name', 255).notNullable();
    table.string('stored_name', 255).notNullable();
    table.string('mime_type', 100).notNullable();
    table.integer('file_size').notNullable(); // in bytes
    table.string('file_path', 500).notNullable();
    table.enum('file_type', ['document', 'image', 'video', 'other']).defaultTo('document');
    table.string('file_hash', 64); // SHA-256 hash for integrity
    table.boolean('is_encrypted').defaultTo(false);
    table.text('metadata'); // JSON metadata (dimensions for images, etc)
    table.timestamp('uploaded_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    // Foreign key to reports (optional - files can exist before report submission)
    table.foreign('report_id').references('id').inTable('reports').onDelete('CASCADE');

    // Indexes
    table.index('file_type');
    table.index('uploaded_at');
    table.index(['report_id', 'file_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('attachments');
};
