#!/bin/bash
# Complete deployment script for roadmap implementation
# Runs migration, ingestion, verification, Stripe products, and bundles

set -e

echo "🚀 KEYS 90-Day Roadmap - Complete Deployment"
echo "=============================================="
echo ""

# Check environment variables
if [ -z "$SUPABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
  echo "❌ SUPABASE_URL or DATABASE_URL must be set"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "Step 1: Running database migration 020..."
echo "----------------------------------------"
tsx scripts/run-migration-020.ts
echo ""

echo "Step 2: Ingesting all keys..."
echo "------------------------------"
tsx scripts/ingest-all-keys.ts
echo ""

echo "Step 3: Verifying keys in marketplace..."
echo "-----------------------------------------"
tsx scripts/verify-keys.ts
echo ""

if [ -n "$STRIPE_SECRET_KEY" ]; then
  echo "Step 4: Creating Stripe products and prices..."
  echo "-----------------------------------------------"
  tsx scripts/create-stripe-products.ts
  echo ""
else
  echo "Step 4: Skipping Stripe products (STRIPE_SECRET_KEY not set)"
  echo ""
fi

echo "Step 5: Creating bundles..."
echo "----------------------------"
tsx scripts/create-bundles.ts
echo ""

echo "✅ Deployment complete!"
echo ""
echo "Summary:"
echo "  ✅ Database migration applied"
echo "  ✅ Keys ingested"
echo "  ✅ Keys verified in marketplace"
if [ -n "$STRIPE_SECRET_KEY" ]; then
  echo "  ✅ Stripe products created"
fi
echo "  ✅ Bundles created"
echo ""
echo "🎉 Roadmap implementation deployment successful!"
