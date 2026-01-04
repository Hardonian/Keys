#!/usr/bin/env tsx
/**
 * Seed marketplace bundles
 * Run this script to create initial bundles in the database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ASSETS_ROOT = process.env.KEYS_ASSETS_ROOT || resolve(process.cwd(), '../../keys-assets');

interface BundleDefinition {
  slug: string;
  title: string;
  description: string;
  bundle_type: 'starter' | 'operator' | 'pro';
  price_cents: number;
  key_slugs: string[];
}

const BUNDLES: BundleDefinition[] = [
  {
    slug: 'starter-bundle',
    title: 'Starter Bundle',
    description: 'Essential KEYS for getting started with proven patterns. Perfect for solo developers and startups.',
    bundle_type: 'starter',
    price_cents: 19900, // $199
    key_slugs: [
      // Add actual key slugs once keys are ingested
      // Example: 'audit-log-capture', 'stripe-webhook-entitlement'
    ],
  },
  {
    slug: 'operator-bundle',
    title: 'Operator Bundle',
    description: 'Production-ready operational patterns for SRE teams and scaling startups.',
    bundle_type: 'operator',
    price_cents: 49900, // $499
    key_slugs: [
      // Add actual key slugs once keys are ingested
    ],
  },
  {
    slug: 'pro-bundle',
    title: 'Pro Bundle',
    description: 'Complete pattern library with all KEYS. Maximum value for comprehensive coverage.',
    bundle_type: 'pro',
    price_cents: 129900, // $1,299
    key_slugs: [
      // Will include all keys (populated dynamically)
    ],
  },
];

async function seedBundles() {
  console.log('🌱 Seeding marketplace bundles...\n');

  // Get all keys to populate pro bundle
  const { data: allKeys } = await supabase
    .from('marketplace_keys')
    .select('id, slug, key_type, maturity, price_cents');

  if (!allKeys || allKeys.length === 0) {
    console.warn('⚠️  No keys found. Please ingest keys first.');
    return;
  }

  // Populate bundles with actual keys
  const starterKeys = allKeys.filter(k => k.maturity === 'starter').slice(0, 5);
  const operatorKeys = allKeys.filter(k => k.maturity === 'operator').slice(0, 7);
  const runbookKeys = allKeys.filter(k => k.key_type === 'runbook').slice(0, 6);

  BUNDLES[0].key_slugs = starterKeys.map(k => k.slug);
  BUNDLES[1].key_slugs = [...operatorKeys, ...runbookKeys].map(k => k.slug);
  BUNDLES[2].key_slugs = allKeys.map(k => k.slug);

  for (const bundleDef of BUNDLES) {
    try {
      // Resolve key slugs to IDs
      const { data: keys } = await supabase
        .from('marketplace_keys')
        .select('id')
        .in('slug', bundleDef.key_slugs);

      if (!keys || keys.length === 0) {
        console.warn(`⚠️  No keys found for bundle ${bundleDef.slug}. Skipping.`);
        continue;
      }

      const keyIds = keys.map(k => k.id);

      // Upsert bundle
      const { data: bundle, error } = await supabase
        .from('marketplace_bundles')
        .upsert(
          {
            slug: bundleDef.slug,
            title: bundleDef.title,
            description: bundleDef.description,
            bundle_type: bundleDef.bundle_type,
            price_cents: bundleDef.price_cents,
            key_ids: keyIds,
          },
          {
            onConflict: 'slug',
          }
        )
        .select('id')
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`✅ Created bundle: ${bundleDef.title} (${bundleDef.key_slugs.length} keys)`);
    } catch (error: any) {
      console.error(`❌ Failed to create bundle ${bundleDef.slug}:`, error.message);
    }
  }

  console.log('\n✨ Bundle seeding complete!');
}

if (require.main === module) {
  seedBundles().catch(console.error);
}

export { seedBundles };
