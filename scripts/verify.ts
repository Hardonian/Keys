#!/usr/bin/env tsx
/**
 * Verify Script
 *
 * Runs the full verification suite:
 * - Lint
 * - Type check
 * - Tests
 * - Build
 */

import { execSync } from 'child_process';

interface VerificationStep {
  name: string;
  command: string;
  required: boolean;
}

const steps: VerificationStep[] = [
  { name: 'Verify Docs', command: 'npm run verify:docs', required: true },
  { name: 'Lint Frontend', command: 'npm run lint:frontend', required: true },
  { name: 'Lint Backend', command: 'npm run lint:backend', required: true },
  { name: 'Type Check Frontend', command: 'npm run type-check:frontend', required: true },
  { name: 'Type Check Backend', command: 'npm run type-check:backend', required: true },
  { name: 'Test Backend', command: 'cd backend && npm run test', required: true },
  { name: 'Test Frontend', command: 'cd frontend && npm run test', required: false }, // Frontend has no tests yet
  { name: 'Build Backend', command: 'npm run build:backend', required: true },
  { name: 'Build Frontend', command: 'npm run build:frontend', required: true },
];

console.log('🔍 Running full verification suite...\n');
console.log('='.repeat(60) + '\n');

let passedCount = 0;
let failedCount = 0;
let skippedCount = 0;

const results: Array<{ step: string; status: 'PASS' | 'FAIL' | 'SKIP'; duration: number; error?: string }> = [];

for (const step of steps) {
  const startTime = Date.now();

  try {
    console.log(`▶️  ${step.name}...`);

    execSync(step.command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    const duration = Date.now() - startTime;
    console.log(`\x1b[32m✓\x1b[0m ${step.name} passed (${(duration / 1000).toFixed(2)}s)\n`);

    results.push({ step: step.name, status: 'PASS', duration });
    passedCount++;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (!step.required) {
      console.log(`\x1b[33m⚠\x1b[0m ${step.name} skipped (not required)\n`);
      results.push({ step: step.name, status: 'SKIP', duration });
      skippedCount++;
      continue;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`\x1b[31m✗\x1b[0m ${step.name} failed (${(duration / 1000).toFixed(2)}s)\n`);

    results.push({ step: step.name, status: 'FAIL', duration, error: errorMessage });
    failedCount++;

    // Stop on first failure
    console.log('\n' + '='.repeat(60));
    console.log(`\n❌ Verification failed at: ${step.name}\n`);
    console.log(`Command: ${step.command}\n`);

    printSummary();
    process.exit(1);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Verification Summary:\n');

  results.forEach(({ step, status, duration }) => {
    const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
    const color = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
    console.log(`   ${color}${icon}\x1b[0m ${step} (${(duration / 1000).toFixed(2)}s)`);
  });

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\n   Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`\n   Passed: ${passedCount}`);
  if (skippedCount > 0) {
    console.log(`   Skipped: ${skippedCount}`);
  }
  if (failedCount > 0) {
    console.log(`   Failed: ${failedCount}`);
  }
}

// All steps passed
console.log('='.repeat(60));
printSummary();
console.log('\n✅ All verification checks passed!\n');
process.exit(0);
