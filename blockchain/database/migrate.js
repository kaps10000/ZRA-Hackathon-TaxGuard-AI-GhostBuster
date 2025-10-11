#!/usr/bin/env node

/**
 * Database Migration Script
 * Run this to create the PostgreSQL database schema
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('./config');

async function runMigration() {
    console.log('🚀 Starting database migration...\n');

    try {
        // Read the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Reading schema from:', schemaPath);
        console.log('📊 Executing SQL migrations...\n');

        // Execute the schema
        await pool.query(schema);

        console.log('✅ Database migration completed successfully!');
        console.log('\n📋 Created:');
        console.log('   - Tables: blocks, events, ghostbuster_detections, whistlepro_reports,');
        console.log('             ai_risk_assessments, predictive_forecasts, case_updates');
        console.log('   - Indexes: Optimized for blockchain queries');
        console.log('   - Views: blockchain_stats, event_type_stats, module_activity');
        console.log('   - Genesis Block: Initialized');

        // Verify the migration
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log('\n✅ Verified tables:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Get block count
        const blockCount = await pool.query('SELECT COUNT(*) as count FROM blocks');
        console.log(`\n📦 Genesis block created. Total blocks: ${blockCount.rows[0].count}`);

        console.log('\n🎉 Migration complete! Database is ready for use.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

// Run the migration
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
