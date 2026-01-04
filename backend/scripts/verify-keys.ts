#!/usr/bin/env tsx
/**
 * Verify keys appear in marketplace
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyKeys() {
  console.log('🔍 Verifying keys in marketplace...\n');

  // Get all keys grouped by tool
  const { data: keys, error } = await supabase
    .from('marketplace_keys')
    .select('slug, title, tool, key_type, maturity, outcome')
    .order('tool', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching keys:', error.message);
    process.exit(1);
  }

  if (!keys || keys.length === 0) {
    console.log('⚠️  No keys found in marketplace');
    process.exit(1);
  }

  console.log(`✅ Found ${keys.length} keys in marketplace\n`);

  // Group by tool
  const byTool: Record<string, typeof keys> = {};
  keys.forEach(key => {
    const tool = key.tool || 'unknown';
    if (!byTool[tool]) {
      byTool[tool] = [];
    }
    byTool[tool].push(key);
  });

  // Display by tool
  for (const [tool, toolKeys] of Object.entries(byTool)) {
    console.log(`📦 ${tool.toUpperCase()} (${toolKeys.length} keys):`);
    toolKeys.forEach(key => {
      console.log(`   - ${key.title} (${key.slug})`);
      console.log(`     Maturity: ${key.maturity || 'N/A'}, Outcome: ${key.outcome || 'N/A'}`);
    });
    console.log();
  }

  // Check for new tool types
  const newTools = ['stripe', 'github', 'supabase', 'cursor'];
  const foundNewTools = newTools.filter(tool => byTool[tool] && byTool[tool].length > 0);

  console.log('📊 New Tool Types Found:');
  foundNewTools.forEach(tool => {
    console.log(`   ✅ ${tool}: ${byTool[tool].length} keys`);
  });

  if (foundNewTools.length === 0) {
    console.log('   ⚠️  No new tool types found');
  }

  console.log('\n✅ Verification complete!');
}

verifyKeys().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
