#!/usr/bin/env node

/**
 * Database and Blockchain Integration Test Script
 * Tests connectivity and integration for all services in the TaxGuard system
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
    log('\n' + '='.repeat(70), 'cyan');
    log(`  ${title}`, 'cyan');
    log('='.repeat(70), 'cyan');
}

async function checkPostgreSQL() {
    header('PostgreSQL Database Check');

    const tests = [];

    // Test 1: Check if PostgreSQL is running
    try {
        const { stdout } = await execAsync('ps aux | grep -i "postgres" | grep -v grep');
        if (stdout.includes('postgres')) {
            log('✓ PostgreSQL process is running', 'green');
            tests.push({ test: 'PostgreSQL Process', status: 'PASS' });
        } else {
            log('✗ PostgreSQL process not found', 'red');
            tests.push({ test: 'PostgreSQL Process', status: 'FAIL' });
        }
    } catch (error) {
        log('✗ Error checking PostgreSQL process: ' + error.message, 'red');
        tests.push({ test: 'PostgreSQL Process', status: 'ERROR' });
    }

    // Test 2: Check if port 5432 is listening (may need to start on TCP)
    try {
        const { stdout } = await execAsync('netstat -tuln 2>/dev/null | grep 5432 || ss -tuln | grep 5432 || echo "not listening"');
        if (stdout.includes('5432') && !stdout.includes('not listening')) {
            log('✓ PostgreSQL is listening on port 5432', 'green');
            tests.push({ test: 'PostgreSQL Port 5432', status: 'PASS' });
        } else {
            log('⚠ PostgreSQL is NOT listening on TCP port 5432 (may be socket-only)', 'yellow');
            tests.push({ test: 'PostgreSQL Port 5432', status: 'WARNING' });
        }
    } catch (error) {
        log('⚠ Could not check port 5432: ' + error.message, 'yellow');
        tests.push({ test: 'PostgreSQL Port 5432', status: 'WARNING' });
    }

    // Test 3: Check database existence
    const databases = ['zra_taxguard', 'whistlepro'];
    for (const db of databases) {
        try {
            // Try different connection methods
            const { stdout, stderr } = await execAsync(`psql -U postgres -lqt 2>&1 | grep -w ${db} || echo "db_not_found"`);

            if (!stdout.includes('db_not_found') && !stderr) {
                log(`✓ Database '${db}' exists`, 'green');
                tests.push({ test: `Database: ${db}`, status: 'PASS' });
            } else {
                log(`✗ Database '${db}' not found or not accessible`, 'red');
                tests.push({ test: `Database: ${db}`, status: 'FAIL' });
            }
        } catch (error) {
            log(`⚠ Cannot verify database '${db}': ${error.message}`, 'yellow');
            tests.push({ test: `Database: ${db}`, status: 'WARNING' });
        }
    }

    return tests;
}

async function checkBlockchain() {
    header('Blockchain Service Check');

    const tests = [];

    // Test 1: Check blockchain port 3001
    try {
        const { stdout } = await execAsync('netstat -tuln 2>/dev/null | grep 3001 || ss -tuln | grep 3001 || echo "not listening"');
        if (stdout.includes('3001') && !stdout.includes('not listening')) {
            log('✓ Blockchain service is listening on port 3001', 'green');
            tests.push({ test: 'Blockchain Port 3001', status: 'PASS' });
        } else {
            log('✗ Blockchain service is NOT listening on port 3001', 'red');
            tests.push({ test: 'Blockchain Port 3001', status: 'FAIL' });
        }
    } catch (error) {
        log('✗ Error checking blockchain port: ' + error.message, 'red');
        tests.push({ test: 'Blockchain Port 3001', status: 'ERROR' });
    }

    // Test 2: Check blockchain health endpoint
    try {
        const { stdout } = await execAsync('curl -s http://localhost:3001/health || echo "failed"');
        if (!stdout.includes('failed') && (stdout.includes('healthy') || stdout.includes('ok'))) {
            log('✓ Blockchain health endpoint responding', 'green');
            tests.push({ test: 'Blockchain Health API', status: 'PASS' });
        } else {
            log('✗ Blockchain health endpoint not responding', 'red');
            tests.push({ test: 'Blockchain Health API', status: 'FAIL' });
        }
    } catch (error) {
        log('✗ Error checking blockchain health: ' + error.message, 'red');
        tests.push({ test: 'Blockchain Health API', status: 'ERROR' });
    }

    // Test 3: Check if blockchain .env exists
    const fs = require('fs');
    if (fs.existsSync('./blockchain/.env')) {
        log('✓ Blockchain .env configuration file exists', 'green');
        tests.push({ test: 'Blockchain Config', status: 'PASS' });

        // Check blockchain database config
        const envContent = fs.readFileSync('./blockchain/.env', 'utf8');
        if (envContent.includes('DB_HOST') && envContent.includes('DB_NAME')) {
            log('✓ Blockchain has database configuration', 'green');
            tests.push({ test: 'Blockchain DB Config', status: 'PASS' });
        }
    } else {
        log('✗ Blockchain .env file not found', 'red');
        tests.push({ test: 'Blockchain Config', status: 'FAIL' });
    }

    return tests;
}

async function checkServices() {
    header('Service Integration Check');

    const tests = [];
    const services = [
        { name: 'API Gateway', port: 4001, path: '/health' },
        { name: 'OCR Backend', port: 3000, path: '/api/health' },
        { name: 'AI Service', port: 5000, path: '/' },
        { name: 'Whistlepro Backend', port: 3005, path: '/api/health' },
        { name: 'GhostBuster', port: 5001, path: '/health' },
        { name: 'Predictive Analytics', port: 5002, path: '/health' },
        { name: 'VRT Guard', port: 5003, path: '/health' }
    ];

    for (const service of services) {
        try {
            const { stdout } = await execAsync(`netstat -tuln 2>/dev/null | grep ${service.port} || ss -tuln | grep ${service.port} || echo "not listening"`);

            if (stdout.includes(service.port.toString()) && !stdout.includes('not listening')) {
                log(`✓ ${service.name} is running on port ${service.port}`, 'green');
                tests.push({ test: `${service.name} (Port ${service.port})`, status: 'PASS' });

                // Try to hit the health endpoint
                try {
                    await execAsync(`curl -s -m 2 http://localhost:${service.port}${service.path} > /dev/null`);
                    log(`  ✓ ${service.name} health endpoint accessible`, 'green');
                } catch (e) {
                    log(`  ⚠ ${service.name} port open but health endpoint not accessible`, 'yellow');
                }
            } else {
                log(`✗ ${service.name} is NOT running on port ${service.port}`, 'red');
                tests.push({ test: `${service.name} (Port ${service.port})`, status: 'FAIL' });
            }
        } catch (error) {
            log(`✗ Error checking ${service.name}: ${error.message}`, 'red');
            tests.push({ test: `${service.name} (Port ${service.port})`, status: 'ERROR' });
        }
    }

    return tests;
}

async function checkServiceConfigs() {
    header('Service Configuration Check');

    const fs = require('fs');
    const tests = [];

    const configs = [
        { name: 'Blockchain', path: './blockchain/.env', requiredKeys: ['DB_HOST', 'DB_NAME', 'PORT'] },
        { name: 'OCR Backend', path: './ocr-backend/.env', requiredKeys: ['DB_HOST', 'DB_NAME', 'BLOCKCHAIN_API_URL'] },
        { name: 'AI Service', path: './ai-service/.env', requiredKeys: ['PORT', 'MONGODB_URI'] },
        { name: 'Whistlepro', path: './whistlepro_backend/.env', requiredKeys: ['DB_HOST', 'DB_NAME', 'PORT'] }
    ];

    for (const config of configs) {
        if (fs.existsSync(config.path)) {
            log(`✓ ${config.name} config file exists: ${config.path}`, 'green');

            const content = fs.readFileSync(config.path, 'utf8');
            const missingKeys = config.requiredKeys.filter(key => !content.includes(key));

            if (missingKeys.length === 0) {
                log(`  ✓ All required configuration keys present`, 'green');
                tests.push({ test: `${config.name} Config`, status: 'PASS' });
            } else {
                log(`  ⚠ Missing keys: ${missingKeys.join(', ')}`, 'yellow');
                tests.push({ test: `${config.name} Config`, status: 'WARNING' });
            }
        } else {
            log(`✗ ${config.name} config file not found: ${config.path}`, 'red');
            tests.push({ test: `${config.name} Config`, status: 'FAIL' });
        }
    }

    return tests;
}

async function generateReport(allTests) {
    header('Test Summary Report');

    let passed = 0, failed = 0, warnings = 0, errors = 0;

    allTests.forEach(test => {
        if (test.status === 'PASS') passed++;
        else if (test.status === 'FAIL') failed++;
        else if (test.status === 'WARNING') warnings++;
        else if (test.status === 'ERROR') errors++;
    });

    const total = allTests.length;

    console.log('\n');
    log(`Total Tests: ${total}`, 'cyan');
    log(`✓ Passed: ${passed}`, 'green');
    log(`✗ Failed: ${failed}`, 'red');
    log(`⚠ Warnings: ${warnings}`, 'yellow');
    log(`! Errors: ${errors}`, 'red');

    const passRate = ((passed / total) * 100).toFixed(1);
    console.log('\n');
    log(`Pass Rate: ${passRate}%`, passRate > 70 ? 'green' : 'red');

    // Recommendations
    header('Recommendations');

    if (failed > 0 || errors > 0) {
        log('\nIssues found that need attention:', 'yellow');

        const dbIssues = allTests.filter(t => t.test.includes('Database') && (t.status === 'FAIL' || t.status === 'ERROR'));
        if (dbIssues.length > 0) {
            log('\n1. PostgreSQL Issues:', 'yellow');
            log('   - Ensure PostgreSQL is running and accessible', 'yellow');
            log('   - Check if databases are created: zra_taxguard, whistlepro', 'yellow');
            log('   - Verify PostgreSQL is listening on localhost:5432', 'yellow');
        }

        const blockchainIssues = allTests.filter(t => t.test.includes('Blockchain') && (t.status === 'FAIL' || t.status === 'ERROR'));
        if (blockchainIssues.length > 0) {
            log('\n2. Blockchain Issues:', 'yellow');
            log('   - Start the blockchain service: cd blockchain && npm start', 'yellow');
            log('   - Verify blockchain config in blockchain/.env', 'yellow');
        }

        const serviceIssues = allTests.filter(t => t.test.includes('Port') && (t.status === 'FAIL' || t.status === 'ERROR'));
        if (serviceIssues.length > 0) {
            log('\n3. Service Issues:', 'yellow');
            log('   - Some services are not running', 'yellow');
            log('   - Run: ./start-all-linux.sh to start all services', 'yellow');
        }
    } else {
        log('\n✓ All critical systems are operational!', 'green');
    }

    console.log('\n');
}

async function main() {
    log('\nTaxGuard AI - Database & Blockchain Integration Test', 'blue');
    log('========================================================', 'blue');

    try {
        const allTests = [];

        // Run all checks
        const dbTests = await checkPostgreSQL();
        allTests.push(...dbTests);

        const blockchainTests = await checkBlockchain();
        allTests.push(...blockchainTests);

        const serviceTests = await checkServices();
        allTests.push(...serviceTests);

        const configTests = await checkServiceConfigs();
        allTests.push(...configTests);

        // Generate report
        await generateReport(allTests);

    } catch (error) {
        log('\n✗ Fatal error during testing: ' + error.message, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run the tests
main();
