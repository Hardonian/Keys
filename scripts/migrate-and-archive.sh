#!/bin/bash
# Migration script for local development and CI/CD
# Detects new migrations, runs them, and archives them

set -e

MIGRATIONS_DIR="backend/supabase/migrations"
ARCHIVE_DIR="backend/supabase/migrations/archive"
TRACKING_FILE="backend/supabase/migrations/.migrations_tracked.txt"
FORCE_MODE="${1:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================="
echo "Database Migration Script"
echo "==========================================${NC}"

# Create directories if they don't exist
mkdir -p "$ARCHIVE_DIR"
touch "$TRACKING_FILE"

# Function to check if migration is tracked
is_tracked() {
  local migration_name="$1"
  grep -q "^$migration_name$" "$TRACKING_FILE" 2>/dev/null
}

# Function to check if migration is archived
is_archived() {
  local migration_name="$1"
  [ -f "$ARCHIVE_DIR/$migration_name" ]
}

# Detect new migrations
echo -e "${YELLOW}Detecting new migrations...${NC}"
NEW_MIGRATIONS=()

for migration_file in "$MIGRATIONS_DIR"/*.sql; do
  # Skip if no SQL files found
  [ -f "$migration_file" ] || continue
  
  migration_name=$(basename "$migration_file")
  
  # Skip if already tracked (unless force mode)
  if [ "$FORCE_MODE" != "true" ] && is_tracked "$migration_name"; then
    echo "⏭️  Skipping $migration_name (already tracked)"
    continue
  fi
  
  # Skip if already archived (unless force mode)
  if [ "$FORCE_MODE" != "true" ] && is_archived "$migration_name"; then
    echo "⏭️  Skipping $migration_name (already archived)"
    continue
  fi
  
  NEW_MIGRATIONS+=("$migration_file")
done

if [ ${#NEW_MIGRATIONS[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ No new migrations to run${NC}"
  exit 0
fi

echo -e "${GREEN}Found ${#NEW_MIGRATIONS[@]} new migration(s):${NC}"
for migration in "${NEW_MIGRATIONS[@]}"; do
  echo "  - $(basename "$migration")"
done

# Check for database connection
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: No database connection configured${NC}"
  echo "Please set DATABASE_URL environment variable"
  echo "Format: postgresql://user:password@host:port/database"
  exit 1
fi

# Run migrations
FAILED_MIGRATIONS=()
SUCCESSFUL_MIGRATIONS=()

for migration_file in "${NEW_MIGRATIONS[@]}"; do
  migration_name=$(basename "$migration_file")
  
  echo ""
  echo -e "${YELLOW}=========================================="
  echo "Running: $migration_name"
  echo "==========================================${NC}"
  
  # Use DATABASE_URL
  DB_URL="$DATABASE_URL"
  
  # Run migration
  if command -v psql &> /dev/null; then
    if psql "$DB_URL" -f "$migration_file" -v ON_ERROR_STOP=1; then
      echo -e "${GREEN}✅ Migration completed successfully${NC}"
      SUCCESSFUL_MIGRATIONS+=("$migration_name")
      
      # Add to tracking file
      echo "$migration_name" >> "$TRACKING_FILE"
      
      # Archive the migration file
      mv "$migration_file" "$ARCHIVE_DIR/$migration_name"
      echo -e "${GREEN}📦 Archived to $ARCHIVE_DIR/$migration_name${NC}"
    else
      echo -e "${RED}❌ Migration failed${NC}"
      FAILED_MIGRATIONS+=("$migration_name")
    fi
  else
    echo -e "${RED}Error: psql not found. Please install PostgreSQL client.${NC}"
    exit 1
  fi
done

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Migration Summary"
echo "==========================================${NC}"
echo -e "${GREEN}Successful: ${#SUCCESSFUL_MIGRATIONS[@]}${NC}"
if [ ${#FAILED_MIGRATIONS[@]} -gt 0 ]; then
  echo -e "${RED}Failed: ${#FAILED_MIGRATIONS[@]}${NC}"
  echo -e "${RED}Failed migrations: ${FAILED_MIGRATIONS[*]}${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
fi
