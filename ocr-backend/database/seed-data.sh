#!/bin/bash

# =====================================================
# ZRA TaxGuard - Mock Data Seeding Script
# =====================================================
# Inserts test data for security features testing
# =====================================================

set -e

echo "🌱 Seeding Mock Data..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SEED_FILE="$SCRIPT_DIR/seed-mock-data.sql"

# Check if seed file exists
if [ ! -f "$SEED_FILE" ]; then
    echo "❌ Error: Seed file not found: $SEED_FILE"
    exit 1
fi

# Check if Docker Compose is running
if ! docker ps | grep -q "zra-postgres"; then
    echo "❌ Error: PostgreSQL container 'zra-postgres' is not running"
    echo "   Start with: docker-compose up -d postgres"
    exit 1
fi

# Run seed script through Docker
echo "📤 Inserting mock data into zra_taxguard database..."
docker exec -i zra-postgres psql -U postgres -d zra_taxguard < "$SEED_FILE"

echo ""
echo "✅ Mock data seeded successfully!"
echo ""
echo "📊 Test Data Summary:"
echo "   - 10 test documents (TEST-DOC-001 to TEST-DOC-010)"
echo "   - Security status distribution: SECURE, ACCEPTABLE, SUSPICIOUS, COMPROMISED"
echo "   - 9 anomalies (7 unresolved, 2 resolved)"
echo "   - 14 audit log entries"
echo ""
echo "🧪 Ready for testing!"
