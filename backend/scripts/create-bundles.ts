#!/usr/bin/env tsx
/**
 * Create marketplace bundles
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
}) : null;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Bundle definitions from roadmap
const BUNDLES = [
  {
    slug: 'saas-starter-stack',
    title: 'SaaS Starter Stack',
    description: 'Complete SaaS starter bundle with Stripe payments, Supabase auth, GitHub templates, and Cursor API routes.',
    bundle_type: 'starter',
    price_cents: 19900, // $199
    key_slugs: [
      'stripe-payment-flow-patterns',
      'supabase-auth-flow-templates',
      'github-repository-templates',
      'cursor-api-route-generation',
    ],
  },
  {
    slug: 'saas-operator-stack',
    title: 'SaaS Operator Stack',
    description: 'Complete SaaS operator bundle with Stripe subscriptions, Supabase RLS, GitHub CI/CD, and Cursor migrations.',
    bundle_type: 'operator',
    price_cents: 29900, // $299
    key_slugs: [
      'stripe-subscription-management',
      'supabase-rls-policy-patterns',
      'github-cicd-starter-workflows',
      'cursor-database-migration-patterns',
    ],
  },
];

async function createBundles() {
  console.log('🚀 Creating marketplace bundles...\n');

  // Get all keys to resolve slugs to IDs
  const { data: allKeys, error: keysError } = await supabase
    .from('marketplace_keys')
    .select('id, slug');

  if (keysError) {
    console.error('❌ Error fetching keys:', keysError.message);
    process.exit(1);
  }

  const keySlugToId = new Map(allKeys?.map(k => [k.slug, k.id]) || []);

  let created = 0;
  let skipped = 0;

  for (const bundleDef of BUNDLES) {
    try {
      // Check if bundle already exists
      const { data: existing } = await supabase
        .from('marketplace_bundles')
        .select('id')
        .eq('slug', bundleDef.slug)
        .single();

      if (existing) {
        console.log(`⏭️  ${bundleDef.slug} - Bundle already exists`);
        skipped++;
        continue;
      }

      // Resolve key slugs to IDs
      const keyIds: string[] = [];
      const missingKeys: string[] = [];

      for (const slug of bundleDef.key_slugs) {
        const keyId = keySlugToId.get(slug);
        if (keyId) {
          keyIds.push(keyId);
        } else {
          missingKeys.push(slug);
        }
      }

      if (missingKeys.length > 0) {
        console.log(`⚠️  ${bundleDef.slug} - Missing keys: ${missingKeys.join(', ')}`);
        console.log(`   Skipping bundle creation`);
        skipped++;
        continue;
      }

      // Create Stripe product for bundle (if Stripe is configured)
      let stripeProductId: string | null = null;
      let stripePriceId: string | null = null;

      if (stripe) {
        try {
          const product = await stripe.products.create({
            name: bundleDef.title,
            description: bundleDef.description,
            metadata: {
              bundle_slug: bundleDef.slug,
              bundle_type: bundleDef.bundle_type,
            },
          });

          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: bundleDef.price_cents,
            currency: 'usd',
            metadata: {
              bundle_slug: bundleDef.slug,
            },
          });

          stripeProductId = product.id;
          stripePriceId = price.id;
        } catch (error: any) {
          console.warn(`⚠️  ${bundleDef.slug} - Could not create Stripe product:`, error.message);
        }
      }

      // Create bundle in database
      const { data: bundle, error: bundleError } = await supabase
        .from('marketplace_bundles')
        .insert({
          slug: bundleDef.slug,
          title: bundleDef.title,
          description: bundleDef.description,
          bundle_type: bundleDef.bundle_type,
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
          price_cents: bundleDef.price_cents,
          key_ids: keyIds,
        })
        .select()
        .single();

      if (bundleError) {
        console.error(`❌ ${bundleDef.slug} - Failed to create bundle:`, bundleError.message);
      } else {
        console.log(`✅ ${bundleDef.slug} - Created bundle with ${keyIds.length} keys`);
        if (stripeProductId) {
          console.log(`   Stripe Product: ${stripeProductId}, Price: ${stripePriceId}`);
        }
        created++;
      }
    } catch (error: any) {
      console.error(`❌ ${bundleDef.slug} - Error:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Created: ${created}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log('\n✅ Bundle creation complete!');
}

createBundles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
