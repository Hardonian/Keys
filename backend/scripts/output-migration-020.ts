#!/usr/bin/env tsx
/**
 * Output migration 020 SQL for manual execution
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationPath = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('📋 Migration 020 SQL (copy and run in Supabase SQL Editor):');
console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log('\n✅ SQL ready for execution');
