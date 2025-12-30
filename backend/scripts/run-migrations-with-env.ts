#!/usr/bin/env tsx
/**
 * Run migrations with explicit environment variable handling
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Try to load from various .env locations
const envPaths = [
  resolve(process.cwd(), '../.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
}

// Also try loading from process.env directly
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl && process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
  const url = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  const dbHost = `db.${url}.supabase.co`;
  process.env.DATABASE_URL = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${dbHost}:5432/postgres`;
}

if (!process.env.DATABASE_URL && !process.env.SUPABASE_URL) {
  console.error('❌ DATABASE_URL or SUPABASE_URL not found');
  console.error('\nPlease set one of:');
  console.error('  export DATABASE_URL="postgresql://..."');
  console.error('  export SUPABASE_URL="https://..." and SUPABASE_DB_PASSWORD="..."');
  process.exit(1);
}

// Run the actual migration script
try {
  execSync('tsx scripts/run-all-migrations.ts', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
} catch (error) {
  process.exit(1);
}
