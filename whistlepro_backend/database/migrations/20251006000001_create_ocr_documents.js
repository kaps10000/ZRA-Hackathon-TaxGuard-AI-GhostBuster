/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw('CREATE SCHEMA IF NOT EXISTS ocr').then(() => {
    return knex.schema.withSchema('ocr').createTable('documents', function(table) {
      // Primary Key
      table.increments('id').primary();

      // Document Identification
      table.string('document_id', 100).unique().notNullable().index();

      // File Information
      table.string('filename', 255).notNullable();
      table.string('original_name', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.bigInteger('file_size').notNullable();
      table.string('mime_type', 100).notNullable();
      table.string('file_hash', 64).notNullable().index();

      // Upload Metadata
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
      table.string('uploaded_by', 100).defaultTo('anonymous');

      // Processing Status
      table.enum('status', ['PENDING', 'PROCESSING', 'VERIFIED', 'FLAGGED', 'ERROR'], {
        useNative: true,
        enumName: 'document_status'
      }).defaultTo('PENDING').index();

      // Custom Metadata (JSONB for flexibility)
      table.jsonb('metadata').defaultTo('{}');

      // OCR/AI Processing Results
      table.jsonb('ocr_data').nullable();
      table.jsonb('ai_metadata').nullable();

      // Risk Assessment
      table.decimal('risk_score', 5, 2).nullable();
      table.enum('verification_status', ['VALID', 'SUSPICIOUS', 'FRAUDULENT', 'INVALID'], {
        useNative: true,
        enumName: 'verification_status_type'
      }).nullable().index();
      table.jsonb('risk_flags').defaultTo('[]');

      // ZRA Verification Result
      table.jsonb('verification_result').nullable();

      // Blockchain Integration
      table.string('blockchain_tx_id', 100).nullable().index();
      table.integer('block_number').nullable();
      table.jsonb('blockchain_proof').nullable();

      // Processing History
      table.jsonb('processing_steps').defaultTo('[]');
      table.jsonb('error_logs').defaultTo('[]');

      // Timestamps
      table.timestamp('processed_at').nullable();
      table.timestamp('verified_at').nullable();
      table.timestamp('last_updated').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      // Composite Indexes
      table.index(['status', 'uploaded_at']);
      table.index(['verification_status', 'uploaded_at']);
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.withSchema('ocr').dropTableIfExists('documents')
    .then(() => knex.raw('DROP SCHEMA IF EXISTS ocr CASCADE'));
};
