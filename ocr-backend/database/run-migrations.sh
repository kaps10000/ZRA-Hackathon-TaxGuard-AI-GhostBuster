#!/bin/bash

# =====================================================
# ZRA TaxGuard OCR - Database Migration Runner
# =====================================================
# Executes SQL migration files against PostgreSQL database
# Usage: ./run-migrations.sh
# =====================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ZRA TaxGuard - Security Tables Migration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# =====================================================
# Configuration
# =====================================================

# Database connection details (override with environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-zra_taxguard}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-zrapass}"

# Migration file
MIGRATION_FILE="migrations/001_create_security_tables.sql"

# =====================================================
# Pre-flight Checks
# =====================================================

echo -e "${YELLOW}[1/4]${NC} Checking prerequisites..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ Error: psql is not installed${NC}"
    echo "  Install with: sudo apt-get install postgresql-client"
    exit 1
fi
echo -e "${GREEN}✓ psql is installed${NC}"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migration file found${NC}"

echo ""

# =====================================================
# Database Connection Test
# =====================================================

echo -e "${YELLOW}[2/4]${NC} Testing database connection..."

# Test connection
export PGPASSWORD="$DB_PASSWORD"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Error: Cannot connect to database${NC}"
    echo "  Host: $DB_HOST:$DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    echo "  If running Docker, try:"
    echo "  docker exec -i zra-postgres psql -U postgres -d zra_taxguard < $MIGRATION_FILE"
    exit 1
fi

echo ""

# =====================================================
# Run Migration
# =====================================================

echo -e "${YELLOW}[3/4]${NC} Running migration: $MIGRATION_FILE"
echo ""

# Execute migration
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE" 2>&1; then
    echo ""
    echo -e "${GREEN}✓ Migration executed successfully${NC}"
else
    echo -e "${RED}✗ Migration failed${NC}"
    exit 1
fi

echo ""

# =====================================================
# Verify Tables Created
# =====================================================

echo -e "${YELLOW}[4/4]${NC} Verifying tables created..."
echo ""

# Check if tables exist
TABLES_CHECK=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'ocr'
    AND table_name IN ('document_security', 'security_audit_log', 'anomaly_detection')
    ORDER BY table_name;
")

# Count tables
TABLE_COUNT=$(echo "$TABLES_CHECK" | grep -v '^[[:space:]]*$' | wc -l)

if [ "$TABLE_COUNT" -eq 3 ]; then
    echo -e "${GREEN}✓ All 3 security tables created successfully:${NC}"
    echo "$TABLES_CHECK" | while read -r table; do
        if [ -n "$table" ]; then
            # Get row count
            COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM ocr.${table// /};")
            echo -e "  ${GREEN}✓${NC} ocr.${table// /} (${COUNT// /} rows)"
        fi
    done
else
    echo -e "${RED}✗ Error: Expected 3 tables, found $TABLE_COUNT${NC}"
    exit 1
fi

echo ""

# =====================================================
# Show Indexes Created
# =====================================================

echo -e "${BLUE}Indexes created:${NC}"
INDEX_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'ocr'
    AND tablename IN ('document_security', 'security_audit_log', 'anomaly_detection');
")
echo -e "  ${GREEN}$INDEX_COUNT indexes created${NC}"

echo ""

# =====================================================
# Migration Complete
# =====================================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ Security tables migration complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Database: ${BLUE}$DB_NAME${NC}"
echo -e "Schema: ${BLUE}ocr${NC}"
echo -e "Tables: ${BLUE}document_security, security_audit_log, anomaly_detection${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test the security scanner with: node test-security-scanner.js"
echo "  2. Start the OCR backend: npm start"
echo "  3. Test API endpoints with Postman or curl"
echo ""
