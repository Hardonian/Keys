/**
 * Test Runner for Template Testing Framework
 * 
 * Runs comprehensive tests on all mega prompt templates
 */

import { templateTestFramework } from './template-test-framework.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🚀 Starting Template Test Framework\n');

  // Test all templates
  console.log('📋 Testing all templates...\n');
  const results = await templateTestFramework.testAllTemplates();

  // Generate report
  console.log('📊 Generating test report...\n');
  const report = templateTestFramework.generateReport(results);

  // Save report
  const reportPath = join(__dirname, 'test-report.md');
  writeFileSync(reportPath, report);
  console.log(`✅ Test report saved to: ${reportPath}\n`);

  // Print summary
  console.log('📈 Test Summary:\n');
  console.log(report.split('## Summary')[1]);

  // Exit with error code if any tests failed
  let hasFailures = false;
  for (const [, templateResults] of results) {
    if (templateResults.some(r => !r.passed)) {
      hasFailures = true;
      break;
    }
  }

  if (hasFailures) {
    console.error('\n❌ Some tests failed. Please review the report.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
