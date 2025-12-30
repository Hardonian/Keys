#!/usr/bin/env tsx
/**
 * Verify database migrations have been applied
 */

import pg from 'pg';
const { Client } = pg;

interface MigrationStatus {
  filename: string;
  applied: boolean;
  appliedAt?: string;
}

/**
 * Get database connection string from environment
 */
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }
  throw new Error('DATABASE_URL or SUPABASE_DB_URL required');
}

/**
 * Get expected migration files
 */
function getExpectedMigrations(): string[] {
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
  ];
}

/**
 * Verify migrations
 */
async function verifyMigrations(): Promise<void> {
  console.log('🔍 Verifying database migrations...\n');

  let databaseUrl: string;
  try {
    databaseUrl = getDatabaseUrl();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nPlease set DATABASE_URL environment variable');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if schema_migrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);

    const migrationsTableExists = tableCheck.rows[0].exists;

    if (!migrationsTableExists) {
      console.log('⚠️  schema_migrations table not found');
      console.log('   Migrations may not have been run via the TypeScript runner\n');
    } else {
      console.log('✅ schema_migrations table exists\n');
    }

    // Get applied migrations
    const appliedMigrations: MigrationStatus[] = [];
    if (migrationsTableExists) {
      const result = await client.query(
        'SELECT filename, applied_at FROM schema_migrations ORDER BY filename'
      );
      appliedMigrations.push(
        ...result.rows.map((row) => ({
          filename: row.filename,
          applied: true,
          appliedAt: row.applied_at,
        }))
      );
    }

    // Check expected migrations
    const expectedMigrations = getExpectedMigrations();
    const statuses: MigrationStatus[] = expectedMigrations.map((filename) => {
      const applied = appliedMigrations.find((m) => m.filename === filename);
      return {
        filename,
        applied: !!applied,
        appliedAt: applied?.appliedAt,
      };
    });

    // Display status
    console.log('📊 Migration Status:\n');
    let allApplied = true;
    statuses.forEach((status) => {
      const icon = status.applied ? '✅' : '❌';
      const date = status.appliedAt ? ` (${new Date(status.appliedAt).toLocaleDateString()})` : '';
      console.log(`  ${icon} ${status.filename}${date}`);
      if (!status.applied) {
        allApplied = false;
      }
    });

    // Verify key tables exist (even if migrations table doesn't)
    console.log('\n🔍 Verifying key tables exist...\n');
    const keyTables = [
      'user_profiles',
      'prompt_atoms',
      'vibe_configs',
      'agent_runs',
      'background_events',
      'organizations',
    ];

    const tableCheckResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[])
    `, [keyTables]);

    const existingTables = tableCheckResult.rows.map((row) => row.table_name);
    const missingTables = keyTables.filter((table) => !existingTables.includes(table));

    keyTables.forEach((table) => {
      const exists = existingTables.includes(table);
      const icon = exists ? '✅' : '❌';
      console.log(`  ${icon} ${table}`);
    });

    // Summary
    console.log('\n📊 Summary:\n');
    const appliedCount = statuses.filter((s) => s.applied).length;
    console.log(`  Migrations tracked: ${appliedCount}/${expectedMigrations.length}`);
    console.log(`  Key tables exist: ${existingTables.length}/${keyTables.length}`);

    if (allApplied && missingTables.length === 0) {
      console.log('\n✅ All migrations verified successfully!');
    } else {
      console.log('\n⚠️  Some migrations or tables are missing');
      if (missingTables.length > 0) {
        console.log(`\n  Missing tables: ${missingTables.join(', ')}`);
      }
      if (!allApplied) {
        console.log('\n  Run migrations: cd backend && npm run migrate');
      }
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Verification error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
