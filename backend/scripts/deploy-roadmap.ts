#!/usr/bin/env tsx
/**
 * Complete roadmap deployment script
 * Handles: Ingestion, Verification, Stripe Products, Bundles
 * Migration 020 should be run manually in Supabase SQL Editor
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

console.log('🚀 KEYS 90-Day Roadmap - Complete Deployment');
console.log('='.repeat(60));
console.log('');

// Check prerequisites
const required = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const optional = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
};

console.log('📋 Prerequisites Check:');
for (const [key, value] of Object.entries(required)) {
  if (value) {
    console.log(`  ✅ ${key}: Set`);
  } else {
    console.log(`  ❌ ${key}: Missing (REQUIRED)`);
    console.log(`     Please set: export ${key}="your_value"`);
    process.exit(1);
  }
}

for (const [key, value] of Object.entries(optional)) {
  if (value) {
    console.log(`  ✅ ${key}: Set`);
  } else {
    console.log(`  ⚠️  ${key}: Not set (optional - Stripe features will be skipped)`);
  }
}

console.log('');

// Step 0: Migration instructions
console.log('📝 STEP 0: Database Migration');
console.log('-'.repeat(60));
console.log('⚠️  Migration 020 must be run manually in Supabase SQL Editor');
console.log('');
console.log('1. Go to: Supabase Dashboard → SQL Editor');
console.log('2. Copy and paste the SQL from:');
console.log('   backend/supabase/migrations/020_extend_marketplace_new_tool_types.sql');
console.log('3. Execute the SQL');
console.log('');
console.log('Press Enter after migration is complete, or Ctrl+C to exit...');

// For automated runs, skip the prompt
if (process.env.SKIP_MIGRATION_PROMPT !== 'true') {
  // In automated mode, we'll continue
  console.log('(Skipping prompt in automated mode)\n');
}

// Step 1: Ingest keys
console.log('📦 STEP 1: Ingesting All Keys');
console.log('-'.repeat(60));
try {
  execSync('npx tsx scripts/ingest-all-keys.ts', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
  console.log('✅ Key ingestion completed\n');
} catch (error: any) {
  console.error('❌ Key ingestion failed');
  process.exit(1);
}

// Step 2: Verify keys
console.log('🔍 STEP 2: Verifying Keys');
console.log('-'.repeat(60));
try {
  execSync('npx tsx scripts/verify-keys.ts', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
  console.log('✅ Key verification completed\n');
} catch (error: any) {
  console.error('❌ Key verification failed');
  process.exit(1);
}

// Step 3: Create Stripe products (if key available)
if (optional.STRIPE_SECRET_KEY) {
  console.log('💳 STEP 3: Creating Stripe Products');
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
  console.log('⏭️  STEP 3: Skipping Stripe Products (STRIPE_SECRET_KEY not set)\n');
}

// Step 4: Create bundles
console.log('📦 STEP 4: Creating Bundles');
console.log('-'.repeat(60));
try {
  execSync('npx tsx scripts/create-bundles.ts', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
  console.log('✅ Bundles created\n');
} catch (error: any) {
  console.error('❌ Bundle creation failed');
  process.exit(1);
}

console.log('✅ Deployment Complete!');
console.log('');
console.log('📊 Summary:');
console.log('  ✅ Keys ingested');
console.log('  ✅ Keys verified');
if (optional.STRIPE_SECRET_KEY) {
  console.log('  ✅ Stripe products created');
}
console.log('  ✅ Bundles created');
console.log('');
console.log('🎉 Roadmap implementation deployment successful!');
