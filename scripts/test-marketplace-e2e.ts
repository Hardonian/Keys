#!/usr/bin/env tsx
/**
 * End-to-end test script for marketplace functionality
 * Tests pack publishing, entitlement granting, and download flow
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Test pack data
const testPack = {
  slug: 'test-pack-e2e',
  title: 'Test Pack (E2E)',
  description: 'This is a test pack for end-to-end testing',
  category: 'testing',
  difficulty: 'beginner' as const,
  runtime_minutes: 30,
  tags: ['test', 'e2e'],
  version: '1.0.0',
  license_spdx: 'MIT',
  preview_public: true,
  assets: {
    zip: 'pack.zip',
    preview_html: 'preview.html',
    cover: 'cover.png',
  },
  sha256: 'test-hash-' + crypto.randomBytes(16).toString('hex'),
};

const libraryJson = {
  version: '1.0.0',
  generated_at: new Date().toISOString(),
  packs: [testPack],
};

async function createTestAssets() {
  console.log('📦 Creating test assets...');

  // Create a minimal ZIP file (empty for testing)
  const zipPath = path.join(__dirname, '../test-assets/pack.zip');
  const previewPath = path.join(__dirname, '../test-assets/preview.html');
  const coverPath = path.join(__dirname, '../test-assets/cover.png');

  // Ensure directory exists
  const assetsDir = path.dirname(zipPath);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Create minimal test files
  fs.writeFileSync(zipPath, Buffer.from('PK\x03\x04')); // Minimal ZIP header
  fs.writeFileSync(previewPath, '<html><body><h1>Test Preview</h1></body></html>');
  fs.writeFileSync(coverPath, Buffer.from('fake-png-data'));

  console.log('✅ Test assets created');
  return { zipPath, previewPath, coverPath };
}

async function uploadAssets() {
  console.log('📤 Uploading assets to storage...');

  const { zipPath, previewPath, coverPath } = await createTestAssets();

  const storagePath = `packs/${testPack.slug}/${testPack.version}`;

  // Upload files
  const zipData = fs.readFileSync(zipPath);
  const previewData = fs.readFileSync(previewPath);
  const coverData = fs.readFileSync(coverPath);

  const { error: zipError } = await supabase.storage
    .from('marketplace')
    .upload(`${storagePath}/pack.zip`, zipData, {
      contentType: 'application/zip',
      upsert: true,
    });

  if (zipError) {
    console.error('❌ Failed to upload ZIP:', zipError);
    return false;
  }

  const { error: previewError } = await supabase.storage
    .from('marketplace')
    .upload(`${storagePath}/preview.html`, previewData, {
      contentType: 'text/html',
      upsert: true,
    });

  if (previewError) {
    console.error('❌ Failed to upload preview:', previewError);
    return false;
  }

  const { error: coverError } = await supabase.storage
    .from('marketplace')
    .upload(`${storagePath}/cover.png`, coverData, {
      contentType: 'image/png',
      upsert: true,
    });

  if (coverError) {
    console.error('❌ Failed to upload cover:', coverError);
    return false;
  }

  console.log('✅ Assets uploaded to storage');
  return true;
}

async function publishPack(authToken: string) {
  console.log('📝 Publishing pack...');

  const response = await fetch(`${API_URL}/marketplace/admin/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      libraryJson,
      dryRun: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Failed to publish:', error);
    return false;
  }

  const result = await response.json();
  console.log('✅ Pack published:', result);
  return true;
}

async function verifyPackListing() {
  console.log('🔍 Verifying pack listing...');

  const response = await fetch(`${API_URL}/marketplace/packs`);
  if (!response.ok) {
    console.error('❌ Failed to fetch packs');
    return false;
  }

  const data = await response.json();
  const pack = data.packs?.find((p: any) => p.slug === testPack.slug);

  if (!pack) {
    console.error('❌ Pack not found in listing');
    return false;
  }

  console.log('✅ Pack found in listing:', pack.title);
  return true;
}

async function verifyPackDetail() {
  console.log('🔍 Verifying pack detail...');

  const response = await fetch(`${API_URL}/marketplace/packs/${testPack.slug}`);
  if (!response.ok) {
    console.error('❌ Failed to fetch pack detail');
    return false;
  }

  const data = await response.json();
  if (data.pack?.slug !== testPack.slug) {
    console.error('❌ Pack detail mismatch');
    return false;
  }

  console.log('✅ Pack detail verified');
  return true;
}

async function grantTestEntitlement(userId: string) {
  console.log('🔑 Granting test entitlement...');

  // Get pack ID
  const { data: pack } = await supabase
    .from('marketplace_packs')
    .select('id')
    .eq('slug', testPack.slug)
    .single();

  if (!pack) {
    console.error('❌ Pack not found');
    return false;
  }

  // Grant entitlement
  const { error } = await supabase.from('marketplace_entitlements').upsert({
    tenant_id: userId,
    tenant_type: 'user',
    pack_id: pack.id,
    source: 'manual',
    status: 'active',
  });

  if (error) {
    console.error('❌ Failed to grant entitlement:', error);
    return false;
  }

  console.log('✅ Entitlement granted');
  return true;
}

async function testDownload(authToken: string) {
  console.log('⬇️ Testing download...');

  const response = await fetch(`${API_URL}/marketplace/packs/${testPack.slug}/download`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Download failed:', error);
    return false;
  }

  const data = await response.json();
  if (!data.downloadUrl) {
    console.error('❌ No download URL returned');
    return false;
  }

  console.log('✅ Download URL generated:', data.downloadUrl.substring(0, 50) + '...');
  return true;
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');

  // Delete pack (cascades to versions and download events)
  const { data: pack } = await supabase
    .from('marketplace_packs')
    .select('id')
    .eq('slug', testPack.slug)
    .single();

  if (pack) {
    await supabase.from('marketplace_packs').delete().eq('id', pack.id);
  }

  // Delete storage assets
  const storagePath = `packs/${testPack.slug}/${testPack.version}`;
  await supabase.storage.from('marketplace').remove([
    `${storagePath}/pack.zip`,
    `${storagePath}/preview.html`,
    `${storagePath}/cover.png`,
  ]);

  console.log('✅ Cleanup complete');
}

async function main() {
  console.log('🚀 Starting marketplace E2E test...\n');

  // Check if we have an auth token
  const authToken = process.env.TEST_AUTH_TOKEN;
  if (!authToken) {
    console.error('❌ TEST_AUTH_TOKEN not set. Please provide a valid auth token.');
    console.log('   Get a token by signing in and copying the JWT from browser dev tools.');
    process.exit(1);
  }

  // Get user ID from token
  const {
    data: { user },
  } = await supabase.auth.getUser(authToken);
  if (!user) {
    console.error('❌ Invalid auth token');
    process.exit(1);
  }

  console.log(`👤 Testing as user: ${user.email || user.id}\n`);

  try {
    // Step 1: Upload assets
    const assetsUploaded = await uploadAssets();
    if (!assetsUploaded) {
      throw new Error('Failed to upload assets');
    }

    // Step 2: Publish pack
    const published = await publishPack(authToken);
    if (!published) {
      throw new Error('Failed to publish pack');
    }

    // Step 3: Verify listing
    const listed = await verifyPackListing();
    if (!listed) {
      throw new Error('Pack not in listing');
    }

    // Step 4: Verify detail
    const detailed = await verifyPackDetail();
    if (!detailed) {
      throw new Error('Pack detail failed');
    }

    // Step 5: Grant entitlement
    const entitled = await grantTestEntitlement(user.id);
    if (!entitled) {
      throw new Error('Failed to grant entitlement');
    }

    // Step 6: Test download
    const downloaded = await testDownload(authToken);
    if (!downloaded) {
      throw new Error('Download failed');
    }

    console.log('\n✅ All tests passed!');

    // Cleanup
    const shouldCleanup = process.argv.includes('--keep') === false;
    if (shouldCleanup) {
      await cleanup();
    } else {
      console.log('\n⚠️  Test data kept (use --keep flag to keep data)');
    }
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    await cleanup();
    process.exit(1);
  }
}

main();
