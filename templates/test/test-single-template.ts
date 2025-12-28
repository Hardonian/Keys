/**
 * Test a single template in detail
 */

import { templateTestFramework } from './template-test-framework.js';
import { generateComprehensiveTestCases } from './comprehensive-test.js';

const templateId = process.argv[2] || 'auth-jwt-middleware';

console.log(`🧪 Testing template: ${templateId}\n`);

const testCases = generateComprehensiveTestCases(templateId);
console.log(`Generated ${testCases.length} test cases\n`);

let passed = 0;
let failed = 0;
const failures: any[] = [];

for (const testCase of testCases) {
  const result = await templateTestFramework.runTestCase(testCase);
  
  if (result.passed) {
    passed++;
    process.stdout.write('.');
  } else {
    failed++;
    failures.push(result);
    process.stdout.write('F');
  }
}

console.log(`\n\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}\n`);

if (failures.length > 0) {
  console.log('\nFailed Tests:\n');
  for (const failure of failures.slice(0, 10)) { // Show first 10 failures
    console.log(`- ${failure.testCase.name}: ${failure.errors.join(', ')}`);
  }
  
  if (failures.length > 10) {
    console.log(`\n... and ${failures.length - 10} more failures`);
  }
}

process.exit(failed > 0 ? 1 : 0);
