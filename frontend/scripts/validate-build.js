#!/usr/bin/env node

/**
 * Build validation script
 * Checks for common issues that could cause Vercel builds to fail
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
];

requiredFiles.forEach((file) => {
  if (!fs.existsSync(path.join(__dirname, '..', file))) {
    errors.push(`Missing required file: ${file}`);
  }
});

// Check package.json
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  );

  // Check for required scripts
  const requiredScripts = ['build', 'dev', 'start'];
  requiredScripts.forEach((script) => {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      errors.push(`Missing required script: ${script}`);
    }
  });

  // Check for Next.js dependency
  if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
    errors.push('Next.js is not listed as a dependency');
  }
} catch (e) {
  errors.push(`Failed to parse package.json: ${e.message}`);
}

// Check next.config.js syntax
try {
  const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    // Try to require it to check syntax
    delete require.cache[require.resolve(nextConfigPath)];
    require(nextConfigPath);
  }
} catch (e) {
  errors.push(`next.config.js has syntax errors: ${e.message}`);
}

// Check TypeScript config
try {
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (fs.existsSync(tsConfigPath)) {
    JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
  }
} catch (e) {
  errors.push(`tsconfig.json has syntax errors: ${e.message}`);
}

// Check for Sentry config files (optional but recommended if Sentry is installed)
const sentryInstalled = fs.existsSync(
  path.join(__dirname, '..', 'node_modules', '@sentry', 'nextjs')
);
if (sentryInstalled) {
  const sentryFiles = [
    'sentry.client.config.ts',
    'sentry.server.config.ts',
    'sentry.edge.config.ts',
  ];
  sentryFiles.forEach((file) => {
    if (!fs.existsSync(path.join(__dirname, '..', file))) {
      warnings.push(
        `Sentry is installed but ${file} is missing. Sentry may not work correctly.`
      );
    }
  });
}

// Output results
if (errors.length > 0) {
  console.error('\n❌ Build validation failed:\n');
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('\n⚠️  Build validation warnings:\n');
  warnings.forEach((warning) => console.warn(`  - ${warning}`));
}

console.log('\n✅ Build validation passed!\n');
process.exit(0);
