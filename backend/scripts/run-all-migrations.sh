#!/bin/bash
# Run all database migrations using DATABASE_URL or SUPABASE_URL from environment

set -e

MIGRATIONS_DIR="backend/supabase/migrations"

echo "🚀 Starting database migrations..."
echo ""

# Check for database URL
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: Neither DATABASE_URL nor SUPABASE_URL found in environment"
  echo ""
  echo "Please set one of:"
  echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
  echo "  export SUPABASE_URL='https://project.supabase.co'"
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'"
  exit 1
fi

# If DATABASE_URL is set, use it directly
if [ -n "$DATABASE_URL" ]; then
  echo "✅ Using DATABASE_URL"
  echo ""
  
  # Check if psql is available
  if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found"
    echo "Please install PostgreSQL client tools"
    exit 1
  fi
  
  # Run migrations using TypeScript runner (more robust)
  if command -v tsx &> /dev/null || command -v npx &> /dev/null; then
    echo "Running migrations via TypeScript runner..."
    cd backend
    npm run migrate
  else
    echo "Running migrations via psql..."
    # Run each migration file in order
    for migration in \
      001_create_user_profiles.sql \
      002_create_prompt_atoms.sql \
      003_create_vibe_configs.sql \
      004_create_agent_runs.sql \
      005_create_background_events.sql \
      006_add_indexes.sql \
      007_add_constraints.sql \
      008_add_premium_features.sql \
      010_create_user_template_customizations.sql \
      011_enhance_template_system.sql \
      012_add_rls_core_tables.sql \
      013_add_billing_and_orgs.sql; do
      
      echo "Running: $migration"
      psql "$DATABASE_URL" -f "$MIGRATIONS_DIR/$migration" || {
        echo "⚠️  Warning: Migration $migration may have already been applied or encountered an error"
      }
    done
  fi

# If SUPABASE_URL is set, try to use Supabase CLI or convert to DATABASE_URL
elif [ -n "$SUPABASE_URL" ]; then
  echo "✅ Using SUPABASE_URL"
  
  # Try Supabase CLI first
  if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    echo ""
    
    # Link to project if needed
    if [ -n "$SUPABASE_PROJECT_ID" ]; then
      supabase link --project-ref "$SUPABASE_PROJECT_ID"
    fi
    
    # Push migrations
    supabase db push || {
      echo "⚠️  Warning: Some migrations may have already been applied"
    }
  else
    echo "❌ Supabase CLI not found"
    echo ""
    echo "Options:"
    echo "1. Install Supabase CLI: npm install -g supabase"
    echo "2. Set DATABASE_URL directly with PostgreSQL connection string"
    echo ""
    echo "To get DATABASE_URL from Supabase:"
    echo "  - Go to Supabase Dashboard → Settings → Database"
    echo "  - Copy the connection string (use 'Connection pooling' mode)"
    echo "  - Set: export DATABASE_URL='postgresql://...'"
    exit 1
  fi
fi

echo ""
echo "✅ Migrations completed!"
