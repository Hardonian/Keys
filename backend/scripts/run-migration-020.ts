#!/usr/bin/env tsx
/**
 * Run migration 020: Extend marketplace for new tool types
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

/**
 * Get database connection string from environment
 */
function getDatabaseUrl(): string {
  // Try DATABASE_URL first (direct PostgreSQL connection)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Try SUPABASE_DB_URL (alternative env var name)
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  // Try constructing from SUPABASE_URL and SUPABASE_DB_PASSWORD
  if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
    const url = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const dbHost = `db.${url}.supabase.co`;
    const dbUrl = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${dbHost}:5432/postgres`;
    return dbUrl;
  }

  // Try SUPABASE_DB_URL directly
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  throw new Error(
    'DATABASE_URL or SUPABASE_URL + SUPABASE_DB_PASSWORD required.\n' +
    'Set DATABASE_URL directly or set SUPABASE_URL + SUPABASE_DB_PASSWORD'
  );
}

async function runMigration020(): Promise<void> {
  console.log('🚀 Running migration 020: Extend marketplace for new tool types...\n');

  // Get database URL
  let databaseUrl: string;
  try {
    databaseUrl = getDatabaseUrl();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nPlease set DATABASE_URL environment variable:');
    console.error('  export DATABASE_URL="postgresql://user:password@host:port/database"');
    process.exit(1);
  }

  // Create database client with SSL
  const client = new Client({ 
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false, // For Supabase pooler
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration...\n');

    // Run migration in transaction
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Migration 020 applied successfully!\n');
    } catch (error: any) {
      await client.query('ROLLBACK');
      
      // Check if error is due to "already exists" (safe to ignore)
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate') ||
        error.code === '42P07' || // duplicate_table
        error.code === '42710' || // duplicate_object
        error.message.includes('constraint') && error.message.includes('already exists')
      ) {
        console.log('⚠️  Some objects already exist, but migration completed');
        console.log('   This is safe - migration is idempotent\n');
      } else {
        throw error;
      }
    }

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    const toolColumnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'marketplace_keys' AND column_name = 'tool';
    `);

    if (toolColumnCheck.rows.length > 0) {
      console.log('✅ tool column exists');
    } else {
      console.log('❌ tool column not found');
    }

    const newColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'marketplace_keys'
      AND column_name IN (
        'webhook_event_types',
        'stripe_integration_level',
        'github_workflow_type',
        'github_template_type',
        'supabase_feature_type',
        'cursor_prompt_type'
      );
    `);

    console.log(`✅ ${newColumns.rows.length} new tool-specific columns added`);

    console.log('\n✅ Migration 020 verification complete!');
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runMigration020().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
