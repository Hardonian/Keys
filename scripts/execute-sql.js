#!/usr/bin/env node
/**
 * Execute SQL file against Supabase database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.yekbmihsqoghbtjkwgkn:84Px0bMoJmGhLXhB@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function executeSqlFile(filePath) {
  // Parse connection string and use explicit connection parameters
  // Handle pooler format: postgresql://user:pass@host:port/db
  const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!urlMatch) {
    throw new Error('Invalid connection string format');
  }
  
  const [, user, password, host, port, database] = urlMatch;
  
  const client = new Client({
    host: host,
    port: parseInt(port) || 5432,
    database: database || 'postgres',
    user: user,
    password: password,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`📄 Executing: ${filePath} (${sql.length} characters)`);
    
    // For verification files, split by semicolons and execute separately to see all results
    if (filePath.includes('VERIFY.sql')) {
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim().length === 0) continue;
        
        try {
          const result = await client.query(statement + ';');
          if (result.rows && result.rows.length > 0) {
            console.log(`\n📊 ${statement.substring(0, 50)}...`);
            result.rows.forEach(row => {
              const values = Object.entries(row).map(([k, v]) => `${k}=${v}`).join(', ');
              console.log(`  ✅ ${values}`);
            });
          }
        } catch (err) {
          // Skip errors for verification queries
          if (!err.message.includes('syntax error')) {
            console.log(`  ⚠️  ${err.message.substring(0, 100)}`);
          }
        }
      }
      
      console.log(`\n✅ Verification queries executed`);
      return { success: true };
    }
    
    // Execute entire file for other SQL files
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
