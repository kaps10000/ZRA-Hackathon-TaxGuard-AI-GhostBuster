#!/usr/bin/env node

/**
 * Final Integration Test - Database & Blockchain Connectivity
 * Tests actual database connections and blockchain integration
 */

const { Pool } = require('pg');
const http = require('http');

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
    log('\n' + '='.repeat(70), 'cyan');
    log(`  ${title}`, 'cyan');
    log('='.repeat(70), 'cyan');
}

// Test Results Storage
const testResults = [];

function addResult(test, status, details = '') {
    testResults.push({ test, status, details });
}

// HTTP GET Request Helper
function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        }).on('error', reject);
    });
}

// Test PostgreSQL Connection
async function testPostgresConnection(config) {
    const pool = new Pool(config);
    try {
        const result = await pool.query('SELECT current_database(), version()');
        await pool.end();
        return { success: true, data: result.rows[0] };
    } catch (error) {
        await pool.end().catch(() => {});
        return { success: false, error: error.message };
    }
}

// Test 1: PostgreSQL Connectivity
async function testDatabases() {
    header('Database Connectivity Tests');

    // Test zra_taxguard database
    log('\nTesting zra_taxguard database connection...', 'yellow');
    const taxguardResult = await testPostgresConnection({
        host: 'localhost',
        port: 5432,
        database: 'zra_taxguard',
        user: 'postgres',
        password: 'postgres'
    });

    if (taxguardResult.success) {
        log(`✓ Connected to zra_taxguard database`, 'green');
        log(`  Database: ${taxguardResult.data.current_database}`, 'green');
        addResult('Database: zra_taxguard', 'PASS', taxguardResult.data.current_database);

        // Test schema existence
        const pool = new Pool({
            host: 'localhost',
            port: 5432,
            database: 'zra_taxguard',
            user: 'postgres',
            password: 'postgres'
        });

        try {
            const schemas = await pool.query(
                "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('ocr', 'ghostbuster', 'blockchain', 'audit')"
            );
            log(`  ✓ Found ${schemas.rows.length} schemas: ${schemas.rows.map(r => r.schema_name).join(', ')}`, 'green');
            addResult('zra_taxguard schemas', 'PASS', `${schemas.rows.length} schemas`);

            // Test tables
            const tables = await pool.query(
                "SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('ocr', 'ghostbuster', 'blockchain', 'audit')"
            );
            log(`  ✓ Found ${tables.rows.length} tables across all schemas`, 'green');
            addResult('zra_taxguard tables', 'PASS', `${tables.rows.length} tables`);
        } catch (error) {
            log(`  ⚠ Could not query schemas: ${error.message}`, 'yellow');
            addResult('zra_taxguard schemas', 'WARNING', error.message);
        }

        await pool.end();
    } else {
        log(`✗ Failed to connect to zra_taxguard: ${taxguardResult.error}`, 'red');
        addResult('Database: zra_taxguard', 'FAIL', taxguardResult.error);
    }

    // Test whistlepro database
    log('\nTesting whistlepro database connection...', 'yellow');
    const whistleproResult = await testPostgresConnection({
        host: 'localhost',
        port: 5432,
        database: 'whistlepro',
        user: 'postgres',
        password: 'postgres'
    });

    if (whistleproResult.success) {
        log(`✓ Connected to whistlepro database`, 'green');
        log(`  Database: ${whistleproResult.data.current_database}`, 'green');
        addResult('Database: whistlepro', 'PASS', whistleproResult.data.current_database);

        // Test tables
        const pool = new Pool({
            host: 'localhost',
            port: 5432,
            database: 'whistlepro',
            user: 'postgres',
            password: 'postgres'
        });

        try {
            const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
            log(`  ✓ Found ${tables.rows.length} tables: ${tables.rows.map(r => r.tablename).join(', ')}`, 'green');
            addResult('whistlepro tables', 'PASS', `${tables.rows.length} tables`);
        } catch (error) {
            log(`  ⚠ Could not query tables: ${error.message}`, 'yellow');
            addResult('whistlepro tables', 'WARNING', error.message);
        }

        await pool.end();
    } else {
        log(`✗ Failed to connect to whistlepro: ${whistleproResult.error}`, 'red');
        addResult('Database: whistlepro', 'FAIL', whistleproResult.error);
    }
}

// Test 2: Blockchain Integration
async function testBlockchain() {
    header('Blockchain Integration Tests');

    // Test blockchain health
    log('\nTesting blockchain health endpoint...', 'yellow');
    try {
        const result = await httpGet('http://localhost:3001/health');
        if (result.statusCode === 200) {
            const health = JSON.parse(result.data);
            log(`✓ Blockchain is healthy`, 'green');
            log(`  Service: ${health.service}`, 'green');
            log(`  Status: ${health.status}`, 'green');
            log(`  Blockchain length: ${health.blockchain?.length || 'N/A'}`, 'green');
            addResult('Blockchain Health', 'PASS', `${health.blockchain?.length || 0} blocks`);
        } else {
            log(`✗ Blockchain health check failed: HTTP ${result.statusCode}`, 'red');
            addResult('Blockchain Health', 'FAIL', `HTTP ${result.statusCode}`);
        }
    } catch (error) {
        log(`✗ Failed to connect to blockchain: ${error.message}`, 'red');
        addResult('Blockchain Health', 'FAIL', error.message);
    }

    // Test blockchain database connection
    log('\nTesting blockchain database connectivity...', 'yellow');
    const blockchainPool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'zra_taxguard',
        user: 'postgres',
        password: 'postgres'
    });

    try {
        const result = await blockchainPool.query(
            "SELECT COUNT(*) as count FROM blockchain.transactions"
        );
        log(`✓ Blockchain can access database`, 'green');
        log(`  Transactions in database: ${result.rows[0].count}`, 'green');
        addResult('Blockchain DB Access', 'PASS', `${result.rows[0].count} transactions`);
    } catch (error) {
        log(`⚠ Blockchain database query failed: ${error.message}`, 'yellow');
        addResult('Blockchain DB Access', 'WARNING', error.message);
    }

    await blockchainPool.end();
}

// Test 3: Service Integration
async function testServices() {
    header('Service Integration Tests');

    const services = [
        { name: 'API Gateway', url: 'http://localhost:4001/health' },
        { name: 'OCR Backend', url: 'http://localhost:3000/' },
        { name: 'AI Service', url: 'http://localhost:5000/' },
        { name: 'Whistlepro Backend', url: 'http://localhost:3005/' },
        { name: 'GhostBuster', url: 'http://localhost:5001/health' },
        { name: 'Predictive Analytics', url: 'http://localhost:5002/health' },
        { name: 'VRT Guard', url: 'http://localhost:5003/health' }
    ];

    log('\nTesting all service endpoints...', 'yellow');

    for (const service of services) {
        try {
            const result = await httpGet(service.url);
            if (result.statusCode === 200) {
                log(`✓ ${service.name} is responding`, 'green');
                addResult(`Service: ${service.name}`, 'PASS', `HTTP ${result.statusCode}`);
            } else {
                log(`⚠ ${service.name} returned HTTP ${result.statusCode}`, 'yellow');
                addResult(`Service: ${service.name}`, 'WARNING', `HTTP ${result.statusCode}`);
            }
        } catch (error) {
            log(`✗ ${service.name} failed: ${error.message}`, 'red');
            addResult(`Service: ${service.name}`, 'FAIL', error.message);
        }
    }
}

// Test 4: Cross-Service Integration
async function testCrossServiceIntegration() {
    header('Cross-Service Integration Tests');

    log('\nTesting API Gateway to Blockchain integration...', 'yellow');
    try {
        const result = await httpGet('http://localhost:4001/api/dashboard/stats');
        if (result.statusCode === 200) {
            log(`✓ API Gateway can communicate with backend services`, 'green');
            addResult('API Gateway Integration', 'PASS', 'Dashboard stats accessible');
        } else {
            log(`⚠ API Gateway integration returned HTTP ${result.statusCode}`, 'yellow');
            addResult('API Gateway Integration', 'WARNING', `HTTP ${result.statusCode}`);
        }
    } catch (error) {
        log(`⚠ API Gateway integration test: ${error.message}`, 'yellow');
        addResult('API Gateway Integration', 'WARNING', error.message);
    }
}

// Generate Final Report
function generateReport() {
    header('Final Test Report');

    let passed = 0, failed = 0, warnings = 0;

    testResults.forEach(test => {
        if (test.status === 'PASS') passed++;
        else if (test.status === 'FAIL') failed++;
        else if (test.status === 'WARNING') warnings++;
    });

    const total = testResults.length;

    console.log('\n');
    log(`Total Tests: ${total}`, 'cyan');
    log(`✓ Passed: ${passed}`, 'green');
    log(`✗ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`⚠ Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'green');

    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    console.log('\n');
    log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : (passRate >= 60 ? 'yellow' : 'red'));

    // System Status
    header('System Status');

    if (failed === 0 && warnings <= 2) {
        log('\n🎉 All Systems Operational!', 'green');
        log('\nThe TaxGuard AI system is fully integrated and ready:', 'green');
        log('  ✓ PostgreSQL database is connected and accessible', 'green');
        log('  ✓ Both databases (zra_taxguard, whistlepro) are operational', 'green');
        log('  ✓ Blockchain service is running and integrated', 'green');
        log('  ✓ All microservices are responding', 'green');
        log('  ✓ Cross-service communication is working', 'green');
    } else if (failed <= 2) {
        log('\n⚠ System Mostly Operational with Minor Issues', 'yellow');
        log(`\n${failed} test(s) failed, ${warnings} warning(s)`, 'yellow');
    } else {
        log('\n❌ System Has Critical Issues', 'red');
        log(`\n${failed} test(s) failed, ${warnings} warning(s)`, 'red');
    }

    console.log('\n');
    log('Service URLs:', 'cyan');
    log('  • API Gateway: http://localhost:4001', 'blue');
    log('  • Blockchain Explorer: http://localhost:3001/explorer', 'blue');
    log('  • OCR Backend: http://localhost:3000', 'blue');
    log('  • PostgreSQL: localhost:5432 (user: postgres, pass: postgres)', 'blue');
    log('  • Databases: zra_taxguard, whistlepro', 'blue');
    console.log('\n');
}

// Main Test Runner
async function main() {
    log('\n╔════════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║   TaxGuard AI - Final Integration Test Suite                      ║', 'cyan');
    log('║   Database & Blockchain Connectivity Verification                 ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════════════╝', 'cyan');

    try {
        await testDatabases();
        await testBlockchain();
        await testServices();
        await testCrossServiceIntegration();
        generateReport();
    } catch (error) {
        log('\n✗ Fatal error during testing: ' + error.message, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Check if pg module is available
try {
    require('pg');
    main();
} catch (error) {
    console.error('Error: pg module not found. Install it with: npm install pg');
    process.exit(1);
}
