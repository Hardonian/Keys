#!/usr/bin/env tsx
/**
 * Ingest all keys from keys-assets directory
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { ingestAllKeys } from '../src/lib/marketplace/ingestion.js';
import { logger } from '../src/utils/logger.js';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function main() {
  console.log('🚀 Starting key ingestion...\n');

  // Verify environment
  if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  try {
    const result = await ingestAllKeys();

    console.log('\n📊 Ingestion Summary:');
    console.log(`  ✅ Successfully ingested: ${result.success}`);
    console.log(`  ❌ Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(({ slug, error }) => {
        console.log(`  - ${slug}: ${error}`);
      });
    }

    if (result.success > 0) {
      console.log('\n✅ Key ingestion completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  No keys were ingested');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Ingestion failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
