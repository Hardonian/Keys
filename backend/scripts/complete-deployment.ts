#!/usr/bin/env tsx
/**
 * Complete deployment: Ingestion, verification, Stripe products, bundles
 * Note: Migration 020 should be run manually in Supabase SQL Editor first
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function main() {
  console.log('🚀 KEYS 90-Day Roadmap - Complete Deployment');
  console.log('='.repeat(60));
  console.log('');

  // Check prerequisites
  if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  console.log('⚠️  IMPORTANT: Migration 020 must be run manually first!');
  console.log('   Run the SQL from: backend/supabase/migrations/020_extend_marketplace_new_tool_types.sql');
  console.log('   in Supabase SQL Editor\n');

  const steps = [
    {
      name: 'Ingest All Keys',
      script: './scripts/ingest-all-keys.ts',
    },
    {
      name: 'Verify Keys',
      script: './scripts/verify-keys.ts',
    },
    {
      name: 'Create Stripe Products',
      script: './scripts/create-stripe-products.ts',
      optional: !process.env.STRIPE_SECRET_KEY,
    },
    {
      name: 'Create Bundles',
      script: './scripts/create-bundles.ts',
    },
  ];

  for (const step of steps) {
    if (step.optional) {
      console.log(`⏭️  Skipping ${step.name} (${step.script} - optional)`);
      continue;
    }

    console.log(`\n📦 ${step.name}...`);
    console.log('-'.repeat(60));

    try {
      const { execSync } = await import('child_process');
      execSync(`npx tsx ${step.script}`, {
        stdio: 'inherit',
        env: process.env,
        cwd: process.cwd(),
      });
      console.log(`✅ ${step.name} completed\n`);
    } catch (error: any) {
      console.error(`❌ ${step.name} failed:`, error.message);
      if (error.status !== 0) {
        process.exit(1);
      }
    }
  }

  console.log('\n✅ Deployment complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
