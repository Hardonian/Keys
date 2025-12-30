#!/usr/bin/env tsx
/**
 * Run all database migrations in order
 * Uses DATABASE_URL or SUPABASE_URL from environment
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

interface MigrationResult {
  filename: string;
  success: boolean;
  error?: string;
  alreadyApplied?: boolean;
}

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
    // Extract project ref from Supabase URL
    // Format: https://[project-ref].supabase.co
    const url = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const dbHost = `db.${url}.supabase.co`;
    const dbUrl = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${dbHost}:5432/postgres`;
    return dbUrl;
  }

  // Last resort: Try SUPABASE_URL with service role key (may not work for direct DB access)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  SUPABASE_URL detected but DATABASE_URL not set.');
    console.warn('   Attempting to construct connection string...');
    console.warn('   For best results, set DATABASE_URL directly.');
    console.warn('   Get it from: Supabase Dashboard → Settings → Database → Connection string');
    
    // This won't work for direct DB access, but we'll try
    throw new Error(
      'DATABASE_URL required for migrations.\n' +
      'Set DATABASE_URL directly or set SUPABASE_DB_PASSWORD.\n' +
      'Get DATABASE_URL from: Supabase Dashboard → Settings → Database → Connection string'
    );
  }

  throw new Error(
    'Neither DATABASE_URL nor SUPABASE_URL found in environment.\n' +
    'Please set DATABASE_URL or SUPABASE_URL + SUPABASE_DB_PASSWORD'
  );
}

/**
 * Get all migration files in order
 */
function getMigrationFiles(): string[] {
  const migrationsDir = join(__dirname, '../supabase/migrations');
  return [
    '001_create_user_profiles.sql',
    '002_create_prompt_atoms.sql',
    '003_create_vibe_configs.sql',
    '004_create_agent_runs.sql',
    '005_create_background_events.sql',
    '006_add_indexes.sql',
    '007_add_constraints.sql',
    '008_add_premium_features.sql',
    '010_create_user_template_customizations.sql',
    '011_enhance_template_system.sql',
    '012_add_rls_core_tables.sql',
    '013_add_billing_and_orgs.sql',
  ].map((filename) => join(migrationsDir, filename));
}

/**
 * Check if migration has been applied
 */
async function checkMigrationApplied(
  client: pg.Client,
  filename: string
): Promise<boolean> {
  try {
    // Check if migrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return false;
    }

    // Check if this migration is recorded
    const result = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [filename]
    );

    return result.rows.length > 0;
  } catch (error) {
    // If table doesn't exist, migration hasn't been applied
    return false;
  }
}

/**
 * Record migration as applied
 */
async function recordMigration(
  client: pg.Client,
  filename: string
): Promise<void> {
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Record migration
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
      [filename]
    );
  } catch (error) {
    console.warn(`Warning: Could not record migration ${filename}:`, error);
  }
}

/**
 * Run a single migration
 */
async function runMigration(
  client: pg.Client,
  filePath: string
): Promise<MigrationResult> {
  const filename = filePath.split('/').pop() || filePath;

  try {
    // Check if already applied
    const alreadyApplied = await checkMigrationApplied(client, filename);
    if (alreadyApplied) {
      console.log(`⏭️  ${filename} - Already applied, skipping`);
      return { filename, success: true, alreadyApplied: true };
    }

    // Read migration file
    const sql = readFileSync(filePath, 'utf-8');

    // Run migration
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await recordMigration(client, filename);
      await client.query('COMMIT');
      console.log(`✅ ${filename} - Applied successfully`);
      return { filename, success: true };
    } catch (error: any) {
      await client.query('ROLLBACK');
      
      // Check if error is due to "already exists" (safe to ignore)
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate') ||
        error.code === '42P07' || // duplicate_table
        error.code === '42710' // duplicate_object
      ) {
        console.log(`⚠️  ${filename} - Objects already exist, marking as applied`);
        await recordMigration(client, filename);
        return { filename, success: true, alreadyApplied: true };
      }

      throw error;
    }
  } catch (error: any) {
    console.error(`❌ ${filename} - Failed:`, error.message);
    return { filename, success: false, error: error.message };
  }
}

/**
 * Main migration runner
 */
async function runAllMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...\n');

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

  // Create database client
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all migration files
    const migrationFiles = getMigrationFiles();
    console.log(`Found ${migrationFiles.length} migration files\n`);

    // Run migrations in order
    const results: MigrationResult[] = [];
    for (const filePath of migrationFiles) {
      const result = await runMigration(client, filePath);
      results.push(result);
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const skipped = results.filter((r) => r.alreadyApplied).length;

    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ⏭️  Skipped (already applied): ${skipped}`);
    console.log(`  ❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Failed migrations:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.filename}: ${r.error}`);
        });
      process.exit(1);
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
runAllMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
