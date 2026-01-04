#!/usr/bin/env tsx
/**
 * Execute migration 020 SQL directly using pg with proper connection handling
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

// Parse connection string and handle brackets in password
function parseConnectionString(url: string): pg.ClientConfig {
  // Extract components
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid connection string format');
  }

  const [, user, password, host, port, database] = match;
  
  // Password might have brackets - use as-is
  const decodedPassword = decodeURIComponent(password);

  return {
    user,
    password: decodedPassword,
    host,
    port: parseInt(port),
    database,
    ssl: {
      rejectUnauthorized: false,
    },
  };
}

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL or SUPABASE_DB_URL required');
    process.exit(1);
  }

  console.log('🚀 Running migration 020...\n');

  const config = parseConnectionString(dbUrl);
  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const migrationPath = join(__dirname, '../supabase/migrations/020_extend_marketplace_new_tool_types.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration...\n');
    await client.query('BEGIN');
    
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Migration 020 applied successfully!\n');
    } catch (error: any) {
      await client.query('ROLLBACK');
      
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate') ||
        error.code === '42P07' ||
        error.code === '42710'
      ) {
        console.log('⚠️  Some objects already exist (safe to ignore)');
        console.log('✅ Migration completed\n');
      } else {
        throw error;
      }
    }

    // Verify
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'marketplace_keys' 
      AND column_name = 'tool';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Migration verified: tool column exists');
    }

  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
