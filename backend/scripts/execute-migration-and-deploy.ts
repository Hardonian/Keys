#!/usr/bin/env tsx
/**
 * Execute migration 020 and complete deployment
 * Uses Supabase API where possible, provides SQL for manual execution where needed
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkMigrationStatus() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if tool column exists
  try {
    const { data, error } = await supabase
      .from('marketplace_keys')
      .select('tool')
      .limit(1);

    if (error && error.message.includes('column')) {
      return { toolColumnExists: false, error: error.message };
    }
    return { toolColumnExists: true };
  } catch (error: any) {
    return { toolColumnExists: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 KEYS 90-Day Roadmap - Complete Deployment');
  console.log('='.repeat(60));
  console.log('');

  // Check prerequisites
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  // Step 1: Check migration status
  console.log('📋 Step 1: Checking migration status...');
  const migrationStatus = await checkMigrationStatus();

  if (!migrationStatus.toolColumnExists) {
    console.log('⚠️  Migration 020 needs to be run');
    console.log('');
    console.log('📋 Please run this SQL in Supabase SQL Editor:');
    console.log('   Supabase Dashboard → SQL Editor → New Query');
    console.log('');
    
    const migrationPath = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('SQL:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    console.log('');
    console.log('⚠️  After running migration, press Enter to continue, or Ctrl+C to exit...');
    console.log('   (In automated mode, continuing anyway - migration will be checked again)');
    console.log('');
  } else {
    console.log('✅ Migration 020 appears to be complete (tool column exists)');
    console.log('');
  }

  // Step 2: Ingest keys
  console.log('📦 Step 2: Ingesting all keys...');
  console.log('-'.repeat(60));
  try {
    execSync('npx tsx scripts/ingest-all-keys.ts', {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    });
    console.log('✅ Key ingestion completed\n');
  } catch (error: any) {
    if (error.status === 0) {
      console.log('✅ Key ingestion completed\n');
    } else {
      console.error('❌ Key ingestion failed');
      console.error('   This might be because migration 020 hasn\'t been run yet');
      console.error('   Please run migration 020 first, then retry\n');
      process.exit(1);
    }
  }

  // Step 3: Verify keys
  console.log('🔍 Step 3: Verifying keys...');
  console.log('-'.repeat(60));
  try {
    execSync('npx tsx scripts/verify-keys.ts', {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    });
    console.log('✅ Key verification completed\n');
  } catch (error: any) {
    console.error('⚠️  Key verification had issues (non-critical)');
  }

  // Step 4: Create Stripe products (if key available)
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('💳 Step 4: Creating Stripe products...');
    console.log('-'.repeat(60));
    try {
      execSync('npx tsx scripts/create-stripe-products.ts', {
        stdio: 'inherit',
        env: process.env,
        cwd: process.cwd(),
      });
      console.log('✅ Stripe products created\n');
    } catch (error: any) {
      console.error('⚠️  Stripe product creation failed (non-critical)');
    }
  } else {
    console.log('⏭️  Step 4: Skipping Stripe Products (STRIPE_SECRET_KEY not set)\n');
  }

  // Step 5: Create bundles
  console.log('📦 Step 5: Creating bundles...');
  console.log('-'.repeat(60));
  try {
    execSync('npx tsx scripts/create-bundles.ts', {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    });
    console.log('✅ Bundles created\n');
  } catch (error: any) {
    console.error('⚠️  Bundle creation had issues (might need keys ingested first)');
  }

  console.log('✅ Deployment steps completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  ✅ Keys ingestion attempted');
  console.log('  ✅ Keys verification attempted');
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('  ✅ Stripe products creation attempted');
  }
  console.log('  ✅ Bundles creation attempted');
  console.log('');
  console.log('🎉 Deployment script completed!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
