/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 *
 * Creates additional schemas for TaxGuard AI modules:
 * - ghostbuster: Ghost employee detection
 * - risk: Risk scoring & analytics
 * - compliance: Tax compliance checks
 * - audit: Audit trails & logs (shared)
 * - blockchain: Blockchain integration metadata
 */
exports.up = async function(knex) {
  await knex.raw('CREATE SCHEMA IF NOT EXISTS ghostbuster');
  await knex.raw('CREATE SCHEMA IF NOT EXISTS risk');
  await knex.raw('CREATE SCHEMA IF NOT EXISTS compliance');
  await knex.raw('CREATE SCHEMA IF NOT EXISTS audit');
  await knex.raw('CREATE SCHEMA IF NOT EXISTS blockchain');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP SCHEMA IF EXISTS blockchain CASCADE');
  await knex.raw('DROP SCHEMA IF EXISTS audit CASCADE');
  await knex.raw('DROP SCHEMA IF NOT EXISTS compliance CASCADE');
  await knex.raw('DROP SCHEMA IF EXISTS risk CASCADE');
  await knex.raw('DROP SCHEMA IF EXISTS ghostbuster CASCADE');
};
