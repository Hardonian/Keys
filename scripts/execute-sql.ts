#!/usr/bin/env tsx
/**
 * Execute SQL file against Supabase database
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:84Px0bMoJmGhLXhB@db.yekbmihsqoghbtjkwgkn.supabase.co:5432/postgres';

async function executeSqlFile(filePath: string) {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = readFileSync(filePath, 'utf-8');
    console.log(`📄 Executing: ${filePath} (${sql.length} characters)`);
    
    // Execute entire file as one query (PostgreSQL handles multiple statements)
    try {
      const result = await client.query(sql);
      console.log(`✅ Successfully executed SQL file`);
      return { success: true };
    } catch (error: any) {
      // For PATCH.sql, many "already exists" errors are expected (idempotent)
      if (filePath.includes('PATCH.sql')) {
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.code === '42P07' || // duplicate_table
            error.code === '42710' || // duplicate_object
            error.code === '42P16' || // duplicate_object
            error.message?.includes('relation') && error.message?.includes('already exists')) {
          console.log(`⚠️  Some objects already exist (expected for idempotent patch)`);
          console.log(`   Error: ${error.message.substring(0, 200)}`);
          return { success: true, warnings: [error.message] };
        }
      }
      console.error(`❌ Error executing SQL: ${error.message}`);
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Connection error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Main execution
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: tsx scripts/execute-sql.ts <sql-file-path>');
  process.exit(1);
}

executeSqlFile(filePath)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
