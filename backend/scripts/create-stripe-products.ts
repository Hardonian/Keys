#!/usr/bin/env tsx
/**
 * Create Stripe products and prices for paid keys
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Key pricing from roadmap
const KEY_PRICING: Record<string, number> = {
  'stripe-subscription-management': 9900, // $99
  'github-cicd-starter-workflows': 4900, // $49
  'supabase-rls-policy-patterns': 7900, // $79
  'cursor-api-route-generation': 5900, // $59
  'stripe-payment-flow-patterns': 4900, // $49
  'jupyter-model-validation-patterns': 6900, // $69
  'github-repository-templates': 3900, // $39
  'supabase-auth-flow-templates': 4900, // $49
  'cursor-database-migration-patterns': 5900, // $59
  'stripe-webhook-handling': 6900, // $69
  'jupyter-eda-workflows': 4900, // $49
  'github-issue-management-patterns': 5900, // $59
  'supabase-realtime-subscription-patterns': 6900, // $69
  'cursor-test-generation-patterns': 5900, // $59
  'stripe-multi-product-billing': 14900, // $149
  'jupyter-production-ml-pipelines': 12900, // $129
};

async function createStripeProducts() {
  console.log('🚀 Creating Stripe products and prices for paid keys...\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not set');
    console.log('   Skipping Stripe product creation');
    return;
  }

  // Get all keys that need pricing
  const { data: keys, error } = await supabase
    .from('marketplace_keys')
    .select('id, slug, title, description, price_cents, stripe_product_id, stripe_price_id')
    .order('slug');

  if (error) {
    console.error('❌ Error fetching keys:', error.message);
    process.exit(1);
  }

  if (!keys || keys.length === 0) {
    console.log('⚠️  No keys found');
    return;
  }

  console.log(`Found ${keys.length} keys to process\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const key of keys) {
    const priceCents = KEY_PRICING[key.slug];
    
    if (!priceCents) {
      console.log(`⏭️  ${key.slug} - No pricing defined, skipping`);
      skipped++;
      continue;
    }

    try {
      // Check if product already exists
      if (key.stripe_product_id) {
        console.log(`⏭️  ${key.slug} - Product already exists (${key.stripe_product_id})`);
        skipped++;
        continue;
      }

      // Create Stripe product
      const product = await stripe.products.create({
        name: key.title,
        description: key.description || `Unlock ${key.title}`,
        metadata: {
          key_slug: key.slug,
          key_id: key.id,
        },
      });

      // Create Stripe price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceCents,
        currency: 'usd',
        metadata: {
          key_slug: key.slug,
          key_id: key.id,
        },
      });

      // Update key in database
      const { error: updateError } = await supabase
        .from('marketplace_keys')
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          price_cents: priceCents,
        })
        .eq('id', key.id);

      if (updateError) {
        console.error(`❌ ${key.slug} - Failed to update database:`, updateError.message);
      } else {
        console.log(`✅ ${key.slug} - Created product ${product.id} and price ${price.id} ($${(priceCents / 100).toFixed(2)})`);
        created++;
      }
    } catch (error: any) {
      console.error(`❌ ${key.slug} - Error:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Created: ${created}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log('\n✅ Stripe product creation complete!');
}

createStripeProducts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
