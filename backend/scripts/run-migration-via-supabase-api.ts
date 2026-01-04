#!/usr/bin/env tsx
/**
 * Run migration 020 via Supabase API (alternative approach)
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
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      db: {
        schema: 'public',
      },
    }
  );

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📝 Executing migration via Supabase API...\n');

  try {
    // Split SQL into individual statements (basic approach)
    // Note: Supabase API might have limitations, so we'll try direct execution
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, try direct query execution
      // For complex migrations, we might need to execute via SQL editor
      console.log('⚠️  Direct RPC not available, migration needs to be run via SQL editor');
      console.log('\n📋 Migration SQL:');
      console.log('---');
      console.log(sql);
      console.log('---');
      console.log('\n✅ Please run this SQL in Supabase SQL Editor');
      return;
    }

    console.log('✅ Migration executed successfully!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Migration SQL (for manual execution):');
    console.log('---');
    console.log(sql);
    console.log('---');
  }
}

runMigrationViaAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
