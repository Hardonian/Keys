#!/usr/bin/env node

/**
 * Asset Validation Script
 * 
 * Validates that required visual assets exist and meet size requirements.
 * Run with ASSET_STRICT=1 to fail on missing assets (for CI).
 */

const fs = require('fs');
const path = require('path');

const isStrict = process.env.ASSET_STRICT === '1';
const publicDir = path.join(__dirname, '..', '..', 'public');
const assetsDir = path.join(publicDir, 'assets', 'visuals');

// Asset requirements
const requiredAssets = [
  {
    path: path.join(publicDir, 'icon-192.png'),
    maxSizeKB: 20,
    required: true,
    description: 'PWA/App icon (192x192)',
  },
  {
    path: path.join(publicDir, 'icon-512.png'),
    maxSizeKB: 50,
    required: true,
    description: 'PWA/App icon (512x512)',
  },
  {
    path: path.join(publicDir, 'og-image.png'),
    maxSizeKB: 250,
    required: true,
    description: 'Open Graph social sharing image (1200x630)',
  },
  {
    path: path.join(assetsDir, 'hero-visual.webp'),
    maxSizeKB: 200,
    required: false,
    description: 'Hero section illustration',
  },
  {
    path: path.join(assetsDir, 'hero-visual-2x.webp'),
    maxSizeKB: 350,
    required: false,
    description: 'Hero section illustration (2x retina)',
  },
  {
    path: path.join(assetsDir, 'empty-library.webp'),
    maxSizeKB: 40,
    required: false,
    description: 'Library empty state illustration',
  },
];

let errors = [];
let warnings = [];

console.log('🔍 Validating assets...\n');

// Check each asset
for (const asset of requiredAssets) {
  const exists = fs.existsSync(asset.path);
  const filename = path.basename(asset.path);
  
  if (!exists) {
    const message = `❌ Missing: ${filename} (${asset.description})`;
    if (asset.required) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
    continue;
  }
  
  // Check file size
  const stats = fs.statSync(asset.path);
  const sizeKB = stats.size / 1024;
  
  if (sizeKB > asset.maxSizeKB) {
    warnings.push(
      `⚠️  ${filename} is ${sizeKB.toFixed(1)}KB (exceeds ${asset.maxSizeKB}KB budget)`
    );
  } else {
    console.log(`✅ ${filename} (${sizeKB.toFixed(1)}KB)`);
  }
}

// Summary
console.log('\n' + '='.repeat(50));

if (errors.length > 0) {
  console.log(`\n🚨 ERRORS (${errors.length}):`);
  errors.forEach(e => console.log(e));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach(w => console.log(w));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✨ All assets validated successfully!');
  process.exit(0);
} else if (errors.length > 0 && isStrict) {
  console.log('\n❌ Validation failed (ASSET_STRICT=1)');
  process.exit(1);
} else if (errors.length > 0) {
  console.log('\n⚠️  Validation completed with missing required assets');
  console.log('   Set ASSET_STRICT=1 to fail CI on missing assets');
  process.exit(0);
} else {
  console.log('\n⚠️  Validation completed with warnings');
  process.exit(0);
}
