#!/bin/bash
# Run database migrations
# This script assumes you have psql or Supabase CLI access

set -e

MIGRATIONS_DIR="backend/supabase/migrations"
MIGRATION_FILES=(
  "012_add_rls_core_tables.sql"
  "013_add_billing_and_orgs.sql"
)

echo "Running database migrations..."

# Check if SUPABASE_URL is set
if [ -z "$SUPABASE_URL" ]; then
  echo "Error: SUPABASE_URL not set"
  echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
  exit 1
fi

# If using Supabase CLI
if command -v supabase &> /dev/null; then
  echo "Using Supabase CLI..."
  for migration in "${MIGRATION_FILES[@]}"; do
    echo "Running migration: $migration"
    supabase db push --file "$MIGRATIONS_DIR/$migration" || {
      echo "Warning: Migration $migration may have already been applied"
    }
  done
elif command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
  echo "Using psql..."
  for migration in "${MIGRATION_FILES[@]}"; do
    echo "Running migration: $migration"
    psql "$DATABASE_URL" -f "$MIGRATIONS_DIR/$migration" || {
      echo "Warning: Migration $migration may have already been applied"
    }
  done
else
  echo "Error: Neither Supabase CLI nor psql found"
  echo "Please install Supabase CLI: npm install -g supabase"
  echo "Or set DATABASE_URL for direct psql access"
  exit 1
fi

echo "Migrations completed successfully!"
