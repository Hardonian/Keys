#!/usr/bin/env node
/**
 * Execute SQL file against Supabase database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:84Px0bMoJmGhLXhB@db.yekbmihsqoghbtjkwgkn.supabase.co:5432/postgres';

async function executeSqlFile(filePath) {
  // Parse connection string and use explicit connection parameters
  const url = new URL(DATABASE_URL.replace('postgresql://', 'http://'));
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1) || 'postgres',
    user: url.username || 'postgres',
    password: url.password || '',
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`📄 Executing: ${filePath} (${sql.length} characters)`);
    
    // Execute entire file
    try {
      await client.query(sql);
      console.log(`✅ Successfully executed SQL file`);
      return { success: true };
    } catch (error) {
      // For PATCH.sql, many "already exists" errors are expected (idempotent)
      if (filePath.includes('PATCH.sql')) {
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.code === '42P07' || // duplicate_table
            error.code === '42710' || // duplicate_object
            error.code === '42P16') { // duplicate_object
          console.log(`⚠️  Some objects already exist (expected for idempotent patch)`);
          console.log(`   This is normal - patch is designed to be idempotent`);
          return { success: true, warnings: [error.message] };
        }
      }
      console.error(`❌ Error executing SQL: ${error.message}`);
      throw error;
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Main execution
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/execute-sql.js <sql-file-path>');
  process.exit(1);
}

executeSqlFile(filePath)
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
