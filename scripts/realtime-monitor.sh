#!/bin/bash
# SURGE PROTOCOL - Real-time Infrastructure Monitor
# This script provides real-time visibility into the infrastructure
# Run periodically to track implementation progress

echo "🌊 SURGE PROTOCOL - Real-time Infrastructure Monitor"
echo "════════════════════════════════════════════════════"
echo ""

# Check database migrations
echo "📊 Database Migration Status:"
MIGRATIONS_DIR="migrations"
for file in $MIGRATIONS_DIR/000*.sql; do
    filename=$(basename "$file")
    echo "  📄 $filename"
done
echo ""

# Check implementation status
echo "🔨 Implementation Status:"
if [ -d "src" ]; then
    echo "  ✅ src/ directory exists"
    if [ -f "src/index.ts" ]; then
        LINES=$(wc -l < src/index.ts)
        echo "  📝 src/index.ts: $LINES lines"
    else
        echo "  🚫 src/index.ts: Not found"
    fi
else
    echo "  🚫 src/ directory: Not found (design phase)"
fi
echo ""

# Check package dependencies
echo "📦 Dependencies:"
npm list hono wrangler 2>/dev/null | grep -E "hono|wrangler" | sed 's/^/  /'
echo ""

# Check git status
echo "🌿 Git Status:"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
COMMITS=$(git log --oneline -5 2>/dev/null | wc -l)
echo "  Current: $BRANCH"
echo "  Recent commits: $COMMITS"
echo ""

# Check infrastructure configuration
echo "⚙️  Infrastructure Configuration:"
if grep -q 'database_id = "d72bdef1-8719-4820-b906-d751414cdd86"' wrangler.toml; then
    echo "  ✅ D1 Database: Configured"
fi
if grep -q 'id = "651042312ee340a097b3cb41cd7c3262"' wrangler.toml; then
    echo "  ✅ KV Namespace: Configured"
fi
if grep -q 'bucket_name = "surge-protocol-assets"' wrangler.toml; then
    echo "  ✅ R2 Bucket: Configured"
fi
echo ""

echo "════════════════════════════════════════════════════"
echo "Generated: $(date)"
echo ""
echo "To generate full report, run:"
echo "  node /tmp/realtime-monitor.js"
echo ""
