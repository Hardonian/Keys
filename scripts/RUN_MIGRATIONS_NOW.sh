#!/bin/bash
# Quick script to run migrations if DATABASE_URL is set

set -e

echo "🚀 Database Migration Runner"
echo ""

if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL or SUPABASE_URL not set"
  echo ""
  echo "Please set one of:"
  echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
  echo "  export SUPABASE_URL='https://project.supabase.co'"
  echo "  export SUPABASE_DB_PASSWORD='your_password'"
  exit 1
fi

echo "✅ Database URL found"
echo ""

cd backend

if [ -f "node_modules/.bin/tsx" ] || command -v tsx &> /dev/null; then
  echo "Running migrations via TypeScript runner..."
  npm run migrate
else
  echo "Installing dependencies..."
  npm install
  echo "Running migrations..."
  npm run migrate
fi

echo ""
echo "✅ Migrations complete!"
echo ""
echo "Verify migrations:"
echo "  npm run verify-migrations"
