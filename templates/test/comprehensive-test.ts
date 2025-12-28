/**
 * Comprehensive Template Testing
 * 
 * Tests templates against:
 * - All filter combinations
 * - All natural language input variations
 * - All user profile variations
 * - Edge cases
 */

import { templateTestFramework } from './template-test-framework.js';
import {
  generateFilterCombinations,
  generateNaturalLanguageInputs,
  generateUserProfileVariations,
} from './filter-combinations.js';
import type { TestCase } from './template-test-framework.js';
import { scaffoldTemplateService } from '../../../backend/src/services/scaffoldTemplateService.js';

/**
 * Generate comprehensive test cases for a template
 */
export function generateComprehensiveTestCases(templateId: string): TestCase[] {
  const template = scaffoldTemplateService.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const testCases: TestCase[] = [];
  const filterCombinations = generateFilterCombinations();
  const userProfiles = generateUserProfileVariations();
  const naturalLanguageInputs = generateNaturalLanguageInputs(template.name.toLowerCase());

  // Test each filter combination
  for (const filterCombo of filterCombinations) {
    // With default profile
    testCases.push({
      name: `${templateId}_${filterCombo.name}_default_profile`,
      description: `Test ${filterCombo.description} with default profile`,
      templateId,
      userProfile: {
        role: 'developer',
        stack: {},
      },
      inputFilter: filterCombo.filter,
      taskDescription: `Setup ${template.name.toLowerCase()}`,
      expectedOutputs: {
        contains: [template.name],
      },
    });

    // With each user profile variation
    for (const profileVar of userProfiles) {
      testCases.push({
        name: `${templateId}_${filterCombo.name}_${profileVar.name}`,
        description: `Test ${filterCombo.description} with ${profileVar.name} profile`,
        templateId,
        userProfile: profileVar.profile,
        inputFilter: filterCombo.filter,
        taskDescription: `Implement ${template.name.toLowerCase()}`,
        expectedOutputs: {
          contains: [template.name],
        },
      });
    }
  }

  // Test natural language variations with common filters
  const commonFilters = [
    { style: 'technical' as const },
    { style: 'detailed' as const },
    { style: 'concise' as const },
    { outputFormat: 'code' as const },
    { outputFormat: 'markdown' as const },
  ];

  for (const nlInput of naturalLanguageInputs.slice(0, 20)) { // Limit to 20 to avoid too many tests
    for (const filter of commonFilters) {
      testCases.push({
        name: `${templateId}_nl_${nlInput.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}_${Object.keys(filter)[0]}`,
        description: `Test natural language input with ${Object.keys(filter)[0]} filter`,
        templateId,
        userProfile: {
          role: 'developer',
          stack: {},
        },
        inputFilter: filter,
        taskDescription: nlInput,
        expectedOutputs: {
          contains: [template.name],
        },
      });
    }
  }

  // Test edge cases
  testCases.push({
    name: `${templateId}_edge_case_empty_input`,
    description: 'Test with empty task description',
    templateId,
    userProfile: {
      role: 'developer',
      stack: {},
    },
    taskDescription: '',
    expectedOutputs: {
      contains: [template.name],
    },
  });

  testCases.push({
    name: `${templateId}_edge_case_very_long_input`,
    description: 'Test with very long task description',
    templateId,
    userProfile: {
      role: 'developer',
      stack: {},
    },
    taskDescription: 'Setup ' + template.name.toLowerCase() + ' '.repeat(500) + 'with all the features',
    expectedOutputs: {
      contains: [template.name],
    },
  });

  testCases.push({
    name: `${templateId}_edge_case_special_chars`,
    description: 'Test with special characters',
    templateId,
    userProfile: {
      role: 'developer',
      company_context: "Company & Co. (Est. 2020) - Special: Characters!",
    },
    taskDescription: `Setup ${template.name.toLowerCase()} with <>&"' characters`,
    expectedOutputs: {
      contains: [template.name],
    },
  });

  // Test variable replacement
  testCases.push({
    name: `${templateId}_variable_replacement_user_role`,
    description: 'Test user role variable replacement',
    templateId,
    userProfile: {
      role: 'staff_engineer',
      stack: {},
    },
    taskDescription: `Setup ${template.name.toLowerCase()}`,
    expectedOutputs: {
      variableReplacements: {
        user_role: 'staff_engineer',
      },
    },
  });

  // Test conditional blocks
  if (template.security_level === 'required') {
    testCases.push({
      name: `${templateId}_conditional_security`,
      description: 'Test security conditional block',
      templateId,
      userProfile: {
        role: 'developer',
        stack: {},
      },
      variables: {
        security_focus: true,
      },
      taskDescription: `Setup secure ${template.name.toLowerCase()}`,
      expectedOutputs: {
        conditionalBlocks: {
          shouldInclude: ['security', 'Security'],
        },
      },
    });
  }

  return testCases;
}

/**
 * Run comprehensive tests for all templates
 */
export async function runComprehensiveTests(): Promise<Map<string, any[]>> {
  const allTemplateIds = scaffoldTemplateService.getAllTemplateIds();
  const allResults = new Map<string, any[]>();

  for (const templateId of allTemplateIds) {
    console.log(`\n🧪 Testing template: ${templateId}`);
    
    const testCases = generateComprehensiveTestCases(templateId);
    console.log(`   Generated ${testCases.length} test cases`);

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const result = await templateTestFramework.runTestCase(testCase);
      results.push(result);
      
      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    console.log(`   ✅ Passed: ${passed}, ❌ Failed: ${failed}`);
    allResults.set(templateId, results);
  }

  return allResults;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests()
    .then((results) => {
      console.log('\n✅ Comprehensive testing complete!');
      console.log(`   Tested ${results.size} templates`);
      
      let totalPassed = 0;
      let totalFailed = 0;
      
      for (const [, templateResults] of results) {
        totalPassed += templateResults.filter(r => r.passed).length;
        totalFailed += templateResults.filter(r => !r.passed).length;
      }
      
      console.log(`   Total: ${totalPassed} passed, ${totalFailed} failed`);
    })
    .catch((error) => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}
