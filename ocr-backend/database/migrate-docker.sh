#!/bin/bash

# =====================================================
# ZRA TaxGuard - Docker Migration Runner
# =====================================================
# Run migrations using Docker Compose postgres container
# Usage: ./migrate-docker.sh
# =====================================================

set -e

echo "🔐 Running Security Tables Migration..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="$SCRIPT_DIR/migrations/001_create_security_tables.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Check if Docker Compose is running
if ! docker ps | grep -q "zra-postgres"; then
    echo "❌ Error: PostgreSQL container 'zra-postgres' is not running"
    echo "   Start with: docker-compose up -d postgres"
    exit 1
fi

# Run migration through Docker
echo "📤 Executing migration on zra_taxguard database..."
docker exec -i zra-postgres psql -U postgres -d zra_taxguard < "$MIGRATION_FILE"

echo ""
echo "✅ Migration completed!"
echo ""
echo "Verifying tables..."
docker exec zra-postgres psql -U postgres -d zra_taxguard -c "
    SELECT table_name,
           (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'ocr' AND table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'ocr'
    AND table_name IN ('document_security', 'security_audit_log', 'anomaly_detection')
    ORDER BY table_name;
"

echo ""
echo "✅ Security tables are ready!"
