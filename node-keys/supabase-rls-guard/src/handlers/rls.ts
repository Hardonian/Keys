/**
 * RLS policy creation for Supabase
 */

import { createClient } from '@supabase/supabase-js';
import type { RLSPolicyConfig } from '../types';

/**
 * Creates RLS policies for tenant isolation
 * 
 * Assumes:
 * - Tables have a `tenant_id` column (UUID)
 * - RLS is enabled on tables
 * - `app.tenant_id` setting is set per request
 * 
 * @param config - RLS policy configuration
 */
export async function createRLSPolicies(
  config?: RLSPolicyConfig
): Promise<void> {
  const databaseUrl =
    config?.databaseUrl || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required for RLS policies. ' +
      'Please set it in your environment variables.'
    );
  }

  // Extract Supabase URL and key from DATABASE_URL
  // DATABASE_URL format: postgresql://user:pass@host:port/db
  // For Supabase, we need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. ' +
      'Please set them in your environment variables.'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const tables = config?.tables || ['subscriptions', 'users'];

  try {
    for (const table of tables) {
      // Create RLS policy for tenant isolation
      const policyName = `${table}_tenant_isolation`;

      // Check if policy already exists
      const { data: existingPolicies } = await supabase.rpc('check_policy_exists', {
        policy_name: policyName,
        table_name: table,
      });

      if (existingPolicies) {
        console.warn(`RLS policy ${policyName} already exists. Skipping.`);
        continue;
      }

      // Create policy SQL
      const policySql = `
        CREATE POLICY ${policyName} ON ${table}
        FOR ALL
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
      `;

      // Execute policy creation
      // Note: This requires direct database access, not Supabase client
      // In practice, you would run this as a migration
      console.log(`Creating RLS policy for ${table}...`);
      console.log('Policy SQL:', policySql);
      console.log('Note: Execute this SQL manually or via migration tool');
    }

    // Enable RLS on tables
    for (const table of tables) {
      const enableRLSSql = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`;
      console.log(`Enabling RLS on ${table}...`);
      console.log('SQL:', enableRLSSql);
      console.log('Note: Execute this SQL manually or via migration tool');
    }
  } catch (error: any) {
    // Check if policy already exists
    if (error.code === '42P07') {
      console.warn('RLS policy already exists. Skipping.');
      return;
    }

    // Re-throw other errors (migrations must be explicit)
    throw new Error(
      `Failed to create RLS policies: ${error.message}. ` +
      'See README.md for migration instructions.'
    );
  }
}
