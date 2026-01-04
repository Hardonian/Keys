#!/usr/bin/env tsx
/**
 * Run migration 020 via Supabase REST API
 * Uses Supabase Management API to execute SQL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrationViaAPI() {
  console.log('🚀 Running migration 020 via Supabase API...\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📝 Attempting to execute migration via Supabase API...\n');
  console.log('⚠️  Note: Supabase API may not support direct SQL execution');
  console.log('   If this fails, run the SQL manually in Supabase SQL Editor\n');

  try {
    // Try using PostgREST RPC (if exec_sql function exists)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // RPC doesn't exist - need manual execution
      console.log('⚠️  Direct SQL execution not available via API');
      console.log('📋 Please run migration manually in Supabase SQL Editor\n');
      console.log('SQL to execute:');
      console.log('='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80));
      console.log('\nAfter running migration, continue with ingestion.');
      return;
    }

    console.log('✅ Migration executed successfully!');
  } catch (error: any) {
    console.log('⚠️  API execution not available');
    console.log('📋 Migration SQL (run manually in Supabase SQL Editor):');
    console.log('='.repeat(80));
    console.log(sql.substring(0, 500) + '...');
    console.log('='.repeat(80));
    console.log('\nFull SQL in: backend/supabase/migrations/020_extend_marketplace_new_tool_types.sql');
  }
}

runMigrationViaAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
