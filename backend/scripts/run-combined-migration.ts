#!/usr/bin/env tsx
/**
 * Run combined migration: Ensure marketplace_keys exists, then apply migration 020
 * Uses Supabase Management API
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

async function runCombinedMigration() {
  console.log('🚀 Running combined migration (018 + 020)...\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check if marketplace_keys table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('marketplace_keys')
    .select('id')
    .limit(1);

  const tableExists = !tableError || !tableError.message.includes('does not exist');

  if (!tableExists) {
    console.log('⚠️  marketplace_keys table does not exist');
    console.log('📋 Need to run migration 018 first (creates marketplace_keys table)');
    console.log('   Then run migration 020 (extends for new tool types)\n');
    
    // Read both migrations
    const migration018Path = join(__dirname, '../supabase/migrations/018_extend_marketplace_all_key_types.sql');
    const migration020Path = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
    
    const migration018 = readFileSync(migration018Path, 'utf-8');
    const migration020 = readFileSync(migration020Path, 'utf-8');
    
    console.log('📋 Combined SQL to run in Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log('-- Migration 018: Create marketplace_keys table');
    console.log(migration018);
    console.log('\n-- Migration 020: Extend for new tool types');
    console.log(migration020);
    console.log('='.repeat(80));
    console.log('\n⚠️  Run this SQL manually in Supabase SQL Editor');
    return;
  }

  // Table exists, try to run migration 020
  console.log('✅ marketplace_keys table exists');
  console.log('📝 Running migration 020...\n');

  const migration020Path = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
  const migration020 = readFileSync(migration020Path, 'utf-8');

  console.log('📋 Migration 020 SQL (run in Supabase SQL Editor):');
  console.log('='.repeat(80));
  console.log(migration020);
  console.log('='.repeat(80));
  console.log('\n⚠️  Run this SQL manually in Supabase SQL Editor');
}

runCombinedMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
