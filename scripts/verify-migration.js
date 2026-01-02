#!/usr/bin/env node
/**
 * Verify migration was successful
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.yekbmihsqoghbtjkwgkn:84Px0bMoJmGhLXhB@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const [, user, password, host, port, database] = urlMatch;

async function verifyMigration() {
  const client = new Client({
    host: host,
    port: parseInt(port) || 5432,
    database: database || 'postgres',
    user: user,
    password: password,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check extensions
    const extensions = await client.query(`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'vector')
    `);
    console.log(`📦 Extensions: ${extensions.rows.length}/2`);
    extensions.rows.forEach(r => console.log(`   ✅ ${r.extname}`));

    // Check tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(`\n📊 Tables: ${tables.rows.length}`);
    const expectedTables = [
      'user_profiles', 'prompt_atoms', 'vibe_configs', 'agent_runs', 'background_events',
      'user_template_customizations', 'template_versions', 'template_customization_history',
      'template_usage_analytics', 'template_feedback', 'shared_template_customizations',
      'template_presets', 'organizations', 'organization_members', 'invitations',
      'usage_metrics', 'failure_patterns', 'success_patterns', 'pattern_matches'
    ];
    expectedTables.forEach(table => {
      const exists = tables.rows.some(r => r.table_name === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });

    // Check RLS
    const rlsTables = await client.query(`
      SELECT c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
      ORDER BY c.relname
    `);
    console.log(`\n🔒 RLS Enabled Tables: ${rlsTables.rows.length}`);
    console.log(`   Expected: 15+ tables with RLS`);

    // Check policies
    const policies = await client.query(`
      SELECT COUNT(*) as count FROM pg_policy pol
      JOIN pg_class c ON c.oid = pol.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
    `);
    console.log(`\n🛡️  RLS Policies: ${policies.rows[0].count}`);
    console.log(`   Expected: 40+ policies`);

    // Check functions
    const functions = await client.query(`
      SELECT p.proname FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname IN ('update_updated_at_column', 'update_user_template_customizations_updated_at', 
                        'track_template_usage', 'create_customization_history')
      ORDER BY p.proname
    `);
    console.log(`\n🔧 Functions: ${functions.rows.length}/4`);
    functions.rows.forEach(r => console.log(`   ✅ ${r.proname}`));

    // Check triggers
    const triggers = await client.query(`
      SELECT trigger_name FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name
    `);
    console.log(`\n⚡ Triggers: ${triggers.rows.length}`);
    console.log(`   Expected: 7+ triggers`);

    // Check indexes
    const indexes = await client.query(`
      SELECT COUNT(*) as count FROM pg_indexes
      WHERE schemaname = 'public'
    `);
    console.log(`\n📇 Indexes: ${indexes.rows[0].count}`);
    console.log(`   Expected: 50+ indexes`);

    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
