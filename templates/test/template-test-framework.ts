/**
 * Template Testing Framework
 * 
 * Tests mega prompt templates against:
 * - All possible filter combinations
 * - Various natural language inputs
 * - Different user profiles
 * - Edge cases and error scenarios
 * 
 * Ensures templates customize correctly and produce desired effects.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import type { UserProfile } from '../../../backend/src/types/index.js';
import type { InputFilter } from '../../../backend/src/types/filters.js';
import { scaffoldTemplateService } from '../../../backend/src/services/scaffoldTemplateService.js';

interface TestCase {
  name: string;
  description: string;
  templateId: string;
  userProfile: Partial<UserProfile>;
  inputFilter?: Partial<InputFilter>;
  taskDescription: string;
  variables?: Record<string, any>;
  expectedOutputs: {
    contains?: string[];
    notContains?: string[];
    variableReplacements?: Record<string, string>;
    conditionalBlocks?: {
      shouldInclude?: string[];
      shouldExclude?: string[];
    };
  };
}

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  errors: string[];
  warnings: string[];
  actualOutput?: string;
  variableChecks?: Record<string, { expected: string; actual: string; passed: boolean }>;
}

export class TemplateTestFramework {
  private testCases: TestCase[] = [];
  private results: TestResult[] = [];

  /**
   * Generate comprehensive test cases for a template
   */
  generateTestCases(templateId: string): TestCase[] {
    const template = scaffoldTemplateService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const testCases: TestCase[] = [];

    // Test Case 1: Basic functionality with minimal inputs
    testCases.push({
      name: `${templateId}_basic`,
      description: 'Basic template modification with minimal inputs',
      templateId,
      userProfile: {
        role: 'developer',
        stack: {},
      },
      taskDescription: `Setup ${template.name.toLowerCase()}`,
      expectedOutputs: {
        contains: [template.name],
        variableReplacements: {
          user_role: 'developer',
        },
      },
    });

    // Test Case 2: All filter styles
    const styles: InputFilter['style'][] = [
      'concise',
      'detailed',
      'technical',
      'conversational',
      'structured',
      'prompt_engineering',
      'chain_of_thought',
      'few_shot',
    ];

    for (const style of styles) {
      testCases.push({
        name: `${templateId}_style_${style}`,
        description: `Test template with ${style} style filter`,
        templateId,
        userProfile: {
          role: 'backend-engineer',
          stack: { express: true },
        },
        inputFilter: { style },
        taskDescription: `Implement ${template.name.toLowerCase()} with ${style} approach`,
        expectedOutputs: {
          contains: [template.name],
          conditionalBlocks: {
            shouldInclude: style === 'technical' ? ['technical'] : [],
          },
        },
      });
    }

    // Test Case 3: Different user roles
    const roles: UserProfile['role'][] = [
      'founder',
      'pm',
      'staff_engineer',
      'devops',
      'cfo',
      'investor',
    ];

    for (const role of roles) {
      testCases.push({
        name: `${templateId}_role_${role}`,
        description: `Test template with ${role} role`,
        templateId,
        userProfile: {
          role,
          stack: {},
        },
        taskDescription: `Create ${template.name.toLowerCase()} for ${role}`,
        expectedOutputs: {
          variableReplacements: {
            user_role: role || 'developer',
          },
        },
      });
    }

    // Test Case 4: Different tech stacks
    const stackConfigs = [
      { express: true, postgresql: true },
      { nextjs: true, supabase: true },
      { fastify: true, mongodb: true },
      { express: true, supabase: true, nextjs: true },
    ];

    for (const stack of stackConfigs) {
      const stackName = Object.keys(stack).join('_');
      testCases.push({
        name: `${templateId}_stack_${stackName}`,
        description: `Test template with ${stackName} stack`,
        templateId,
        userProfile: {
          role: 'backend-engineer',
          stack: stack as any,
        },
        taskDescription: `Setup ${template.name.toLowerCase()} using ${stackName}`,
        expectedOutputs: {
          contains: [template.name],
        },
      });
    }

    // Test Case 5: Security focus variations
    testCases.push({
      name: `${templateId}_security_focus`,
      description: 'Test template with security focus',
      templateId,
      userProfile: {
        role: 'staff_engineer',
        stack: { express: true },
      },
      variables: {
        security_focus: true,
      },
      taskDescription: `Implement secure ${template.name.toLowerCase()}`,
      expectedOutputs: {
        conditionalBlocks: {
          shouldInclude: template.security_level === 'required' ? ['security', 'Security'] : [],
        },
      },
    });

    // Test Case 6: Performance focus variations
    testCases.push({
      name: `${templateId}_performance_focus`,
      description: 'Test template with performance focus',
      templateId,
      userProfile: {
        role: 'devops',
        stack: { express: true },
      },
      variables: {
        performance_focus: true,
      },
      taskDescription: `Optimize ${template.name.toLowerCase()} for performance`,
      expectedOutputs: {
        conditionalBlocks: {
          shouldInclude: template.optimization_level === 'required' ? ['performance', 'Performance', 'optimization'] : [],
        },
      },
    });

    // Test Case 7: Natural language variations
    const naturalLanguageInputs = [
      `I need to ${template.name.toLowerCase()}`,
      `Can you help me set up ${template.name.toLowerCase()}?`,
      `Create a ${template.name.toLowerCase()} implementation`,
      `Build ${template.name.toLowerCase()} with best practices`,
      `Scaffold ${template.name.toLowerCase()} for production`,
      `Implement ${template.name.toLowerCase()} following security guidelines`,
      `Generate ${template.name.toLowerCase()} code`,
      `Setup ${template.name.toLowerCase()} middleware`,
    ];

    for (const [index, input] of naturalLanguageInputs.entries()) {
      testCases.push({
        name: `${templateId}_nl_${index}`,
        description: `Test with natural language: "${input.substring(0, 50)}..."`,
        templateId,
        userProfile: {
          role: 'developer',
          stack: {},
        },
        taskDescription: input,
        expectedOutputs: {
          contains: [template.name],
        },
      });
    }

    // Test Case 8: Combined filters
    testCases.push({
      name: `${templateId}_combined_filters`,
      description: 'Test template with multiple filters combined',
      templateId,
      userProfile: {
        role: 'staff_engineer',
        stack: { express: true, supabase: true },
        company_context: 'E-commerce platform',
        brand_voice: 'Professional and clear',
      },
      inputFilter: {
        style: 'technical',
        outputFormat: 'code',
        tone: 'serious',
        usePromptEngineering: true,
      },
      taskDescription: `Create production-ready ${template.name.toLowerCase()}`,
      expectedOutputs: {
        contains: [template.name, 'E-commerce platform', 'Professional'],
        variableReplacements: {
          user_role: 'staff_engineer',
        },
      },
    });

    // Test Case 9: Edge cases
    testCases.push({
      name: `${templateId}_edge_case_empty`,
      description: 'Test with empty/minimal inputs',
      templateId,
      userProfile: {},
      taskDescription: '',
      expectedOutputs: {
        contains: [template.name],
      },
    });

    testCases.push({
      name: `${templateId}_edge_case_special_chars`,
      description: 'Test with special characters in inputs',
      templateId,
      userProfile: {
        role: 'developer',
        company_context: "Company & Co. (Est. 2020) - Special: Characters!",
      },
      taskDescription: `Setup ${template.name.toLowerCase()} with special chars: <>&"'`,
      expectedOutputs: {
        contains: [template.name],
      },
    });

    return testCases;
  }

  /**
   * Run a single test case
   */
  async runTestCase(testCase: TestCase): Promise<TestResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let actualOutput: string | undefined;

    try {
      // Get template
      const template = scaffoldTemplateService.getTemplate(testCase.templateId);
      if (!template) {
        errors.push(`Template ${testCase.templateId} not found`);
        return {
          testCase,
          passed: false,
          errors,
          warnings,
        };
      }

      // Generate prompt
      const result = scaffoldTemplateService.generateScaffoldPrompt(
        testCase.taskDescription,
        testCase.userProfile as UserProfile,
        [testCase.templateId],
        {
          userProfile: testCase.userProfile as UserProfile,
          inputFilter: testCase.inputFilter as InputFilter,
          variables: testCase.variables,
        }
      );

      actualOutput = result.systemPrompt;

      // Validate expected outputs
      if (testCase.expectedOutputs.contains) {
        for (const expected of testCase.expectedOutputs.contains) {
          if (!actualOutput.includes(expected)) {
            errors.push(`Expected to contain "${expected}" but it doesn't`);
          }
        }
      }

      if (testCase.expectedOutputs.notContains) {
        for (const notExpected of testCase.expectedOutputs.notContains) {
          if (actualOutput.includes(notExpected)) {
            errors.push(`Expected NOT to contain "${notExpected}" but it does`);
          }
        }
      }

      // Check variable replacements
      if (testCase.expectedOutputs.variableReplacements) {
        const variableChecks: Record<string, { expected: string; actual: string; passed: boolean }> = {};
        
        for (const [varName, expectedValue] of Object.entries(testCase.expectedOutputs.variableReplacements)) {
          // Check if variable was replaced (not present as placeholder)
          const placeholderPattern = new RegExp(`\\{\\{${varName}(?:\\|[^}]+)?\\}\\}`, 'g');
          const hasPlaceholder = placeholderPattern.test(actualOutput);
          
          // Check if expected value appears in output
          const hasExpectedValue = actualOutput.includes(expectedValue);
          
          const passed = !hasPlaceholder && hasExpectedValue;
          
          variableChecks[varName] = {
            expected: expectedValue,
            actual: hasPlaceholder ? 'PLACEHOLDER_NOT_REPLACED' : (hasExpectedValue ? expectedValue : 'NOT_FOUND'),
            passed,
          };

          if (!passed) {
            errors.push(`Variable ${varName}: expected "${expectedValue}", but placeholder not replaced or value not found`);
          }
        }

        return {
          testCase,
          passed: errors.length === 0,
          errors,
          warnings,
          actualOutput,
          variableChecks,
        };
      }

      // Check conditional blocks
      if (testCase.expectedOutputs.conditionalBlocks) {
        const { shouldInclude = [], shouldExclude = [] } = testCase.expectedOutputs.conditionalBlocks;

        for (const include of shouldInclude) {
          if (!actualOutput.includes(include)) {
            warnings.push(`Conditional block should include "${include}" but it doesn't`);
          }
        }

        for (const exclude of shouldExclude) {
          if (actualOutput.includes(exclude)) {
            errors.push(`Conditional block should exclude "${exclude}" but it's present`);
          }
        }
      }

    } catch (error) {
      errors.push(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      testCase,
      passed: errors.length === 0,
      errors,
      warnings,
      actualOutput,
    };
  }

  /**
   * Run all test cases for a template
   */
  async testTemplate(templateId: string): Promise<TestResult[]> {
    const testCases = this.generateTestCases(templateId);
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runTestCase(testCase);
      results.push(result);
    }

    return results;
  }

  /**
   * Run tests for all templates
   */
  async testAllTemplates(): Promise<Map<string, TestResult[]>> {
    const allTemplateIds = scaffoldTemplateService.getAllTemplateIds();
    const allResults = new Map<string, TestResult[]>();

    for (const templateId of allTemplateIds) {
      console.log(`Testing template: ${templateId}`);
      const results = await this.testTemplate(templateId);
      allResults.set(templateId, results);
    }

    return allResults;
  }

  /**
   * Generate test report
   */
  generateReport(results: Map<string, TestResult[]>): string {
    let report = '# Template Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const [templateId, templateResults] of results) {
      report += `## ${templateId}\n\n`;
      
      const templatePassed = templateResults.filter(r => r.passed).length;
      const templateFailed = templateResults.filter(r => !r.passed).length;
      
      totalTests += templateResults.length;
      passedTests += templatePassed;
      failedTests += templateFailed;

      report += `**Status**: ${templatePassed}/${templateResults.length} passed\n\n`;

      // Failed tests
      const failed = templateResults.filter(r => !r.passed);
      if (failed.length > 0) {
        report += `### Failed Tests (${failed.length})\n\n`;
        for (const result of failed) {
          report += `- **${result.testCase.name}**: ${result.testCase.description}\n`;
          report += `  - Errors: ${result.errors.join(', ')}\n`;
          if (result.warnings.length > 0) {
            report += `  - Warnings: ${result.warnings.join(', ')}\n`;
          }
        }
        report += '\n';
      }

      // Warnings
      const withWarnings = templateResults.filter(r => r.warnings.length > 0 && r.passed);
      if (withWarnings.length > 0) {
        report += `### Tests with Warnings (${withWarnings.length})\n\n`;
        for (const result of withWarnings) {
          report += `- **${result.testCase.name}**: ${result.warnings.join(', ')}\n`;
        }
        report += '\n';
      }
    }

    // Summary
    report += `## Summary\n\n`;
    report += `- **Total Tests**: ${totalTests}\n`;
    report += `- **Passed**: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)\n`;
    report += `- **Failed**: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)\n`;

    return report;
  }
}

export const templateTestFramework = new TemplateTestFramework();
