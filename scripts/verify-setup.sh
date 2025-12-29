#!/bin/bash
# Verify production setup

set -e

echo "=== Production Setup Verification ==="
echo ""

# Check environment variables
echo "1. Checking environment variables..."
REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  exit 1
else
  echo "✅ All required environment variables are set"
fi

# Check dependencies
echo ""
echo "2. Checking dependencies..."
cd frontend && npm list --depth=0 > /dev/null 2>&1 && echo "✅ Frontend dependencies installed" || echo "❌ Frontend dependencies missing"
cd ../backend && npm list --depth=0 > /dev/null 2>&1 && echo "✅ Backend dependencies installed" || echo "❌ Backend dependencies missing"
cd ..

# Check migrations
echo ""
echo "3. Checking migrations..."
if [ -f "backend/supabase/migrations/012_add_rls_core_tables.sql" ] && \
   [ -f "backend/supabase/migrations/013_add_billing_and_orgs.sql" ]; then
  echo "✅ Migration files exist"
else
  echo "❌ Migration files missing"
fi

# Type check
echo ""
echo "4. Running type checks..."
cd frontend && npm run type-check > /dev/null 2>&1 && echo "✅ Frontend type check passed" || echo "⚠️  Frontend type check has issues"
cd ../backend && npm run type-check > /dev/null 2>&1 && echo "✅ Backend type check passed" || echo "⚠️  Backend type check has issues"
cd ..

echo ""
echo "=== Verification Complete ==="
