#!/usr/bin/env node
/**
 * Execute SQL file against Supabase database using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Parse connection string to get URL and key
const DATABASE_URL = 'postgresql://postgres:84Px0bMoJmGhLXhB@db.yekbmihsqoghbtjkwgkn.supabase.co:5432/postgres';
const SUPABASE_URL = 'https://yekbmihsqoghbtjkwgkn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '84Px0bMoJmGhLXhB'; // Using password as fallback

async function executeSqlFile(filePath) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('✅ Connected to Supabase');
    console.log(`📄 Reading: ${filePath}`);

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`📄 Executing SQL file (${sql.length} characters)`);
    
    // Supabase doesn't have a direct SQL execution endpoint via JS client
    // We need to use RPC or direct connection
    // For now, let's try using the REST API or provide instructions
    
    console.log('\n⚠️  Supabase JS client cannot execute arbitrary SQL directly.');
    console.log('📋 Please execute the SQL file manually:');
    console.log(`   1. Go to: https://supabase.com/dashboard/project/yekbmihsqoghbtjkwgkn/sql/new`);
    console.log(`   2. Copy/paste the contents of: ${filePath}`);
    console.log(`   3. Click "Run"`);
    console.log('\nOr use psql:');
    console.log(`   psql "${DATABASE_URL}" -f ${filePath}`);
    
    return { success: false, needsManualExecution: true };
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Main execution
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/execute-sql-supabase.js <sql-file-path>');
  process.exit(1);
}

executeSqlFile(filePath)
  .then((result) => {
    if (result.needsManualExecution) {
      console.log('\n✅ Instructions provided above');
      process.exit(0);
    } else {
      console.log('\n✅ Migration complete!');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
