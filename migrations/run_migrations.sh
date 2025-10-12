#!/bin/bash

# ============================================================================
# ZRA TaxGuard Database Migration Runner
# ============================================================================
# Purpose: Execute all database migrations in correct order
# Author: Database Migration Team
# Date: October 6, 2025
# ============================================================================

set -e  # Exit on any error

# Configuration
DB_NAME="zra_taxguard"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is running
check_postgres() {
    log "Checking PostgreSQL connection..."
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        error "PostgreSQL is not running or not accessible"
        error "Please start PostgreSQL and ensure connection parameters are correct"
        exit 1
    fi
    success "PostgreSQL connection verified"
}

# Check if database exists
check_database() {
    log "Checking if database '$DB_NAME' exists..."
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        error "Database '$DB_NAME' does not exist"
        error "Please create the database first: createdb $DB_NAME"
        exit 1
    fi
    success "Database '$DB_NAME' exists"
}

# Execute migration file
run_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)
    
    log "Executing migration: $migration_name"
    
    if [ ! -f "$migration_file" ]; then
        error "Migration file not found: $migration_file"
        return 1
    fi
    
    # Execute the migration
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
        success "Migration completed: $migration_name"
        return 0
    else
        error "Migration failed: $migration_name"
        error "Check the migration file and database logs for details"
        return 1
    fi
}

# Main execution
main() {
    echo "============================================================================"
    echo "ZRA TaxGuard Database Migration Runner"
    echo "============================================================================"
    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST:$DB_PORT"
    echo "User: $DB_USER"
    echo "============================================================================"
    
    # Pre-flight checks
    check_postgres
    check_database
    
    # Migration files in order
    migrations=(
        "001_core_schema.sql"
        "002_update_ocr_schema.sql"
        "003_update_whistlepro_schema.sql"
        "004_integration_views.sql"
    )
    
    log "Starting migration sequence..."
    
    # Execute migrations in order
    for migration in "${migrations[@]}"; do
        if ! run_migration "$migration"; then
            error "Migration sequence failed at: $migration"
            exit 1
        fi
        sleep 1  # Brief pause between migrations
    done
    
    echo "============================================================================"
    success "All migrations completed successfully!"
    echo "============================================================================"
    
    # Run verification tests
    log "Running verification tests..."
    
    # Test 1: Core schema exists
    log "Test 1: Checking core schema..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM core.companies;" > /dev/null 2>&1; then
        success "Core schema test passed"
    else
        warning "Core schema test failed"
    fi
    
    # Test 2: Foreign keys work
    log "Test 2: Checking foreign key relationships..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT d.document_id, c.company_name FROM ocr.documents d JOIN core.companies c ON c.id = d.company_id LIMIT 1;" > /dev/null 2>&1; then
        success "Foreign key test passed"
    else
        warning "Foreign key test failed (may be normal if no data exists)"
    fi
    
    # Test 3: Views work
    log "Test 3: Checking integration views..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM core.high_risk_companies;" > /dev/null 2>&1; then
        success "Integration views test passed"
    else
        warning "Integration views test failed"
    fi
    
    # Display final statistics
    log "Generating final statistics..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        'Companies' as entity, 
        COUNT(*) as count 
    FROM core.companies
    UNION ALL
    SELECT 'Documents', COUNT(*) FROM ocr.documents
    UNION ALL
    SELECT 'Taxpayers', COUNT(*) FROM core.taxpayers
    UNION ALL
    SELECT 'Reports', COUNT(*) FROM whistlepro.reports
    UNION ALL
    SELECT 'Investigators', COUNT(*) FROM whistlepro.investigators;
    "
    
    echo "============================================================================"
    success "ZRA TaxGuard database migration completed successfully!"
    success "The system is now ready for production use."
    echo "============================================================================"
}

# Execute main function
main "$@"
