/**
 * Template Testing Service
 * 
 * Allows users to test template customizations before saving
 */

import { scaffoldTemplateService } from './scaffoldTemplateService.js';
import { templateValidationService } from './templateValidationService.js';
import type { UserProfile } from '../types/index.js';
import type { InputFilter } from '../types/filters.js';
import { logger } from '../utils/logger.js';

export interface TemplateTestResult {
  success: boolean;
  renderedPrompt: string;
  validationResult: {
    valid: boolean;
    errors: Array<{ field: string; message: string; code: string }>;
    warnings: string[];
  };
  variableReplacements: Record<string, { expected: string; actual: string; replaced: boolean }>;
  conditionalBlocks: {
    rendered: string[];
    skipped: string[];
  };
  metadata: {
    templateId: string;
    variablesUsed: string[];
    conditionalsEvaluated: number;
    promptLength: number;
  };
}

export class TemplateTestingService {
  /**
   * Test template customization without saving
   */
  async testTemplateCustomization(
    templateId: string,
    userProfile: Partial<UserProfile>,
    options: {
      customVariables?: Record<string, any>;
      customInstructions?: string;
      inputFilter?: Partial<InputFilter>;
      taskDescription?: string;
    } = {}
  ): Promise<TemplateTestResult> {
    const template = scaffoldTemplateService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate customization
    const validationResult = templateValidationService.validateCustomization(
      templateId,
      options.customVariables || {},
      options.customInstructions
    );

    // Generate prompt with test data
    const testPrompt = scaffoldTemplateService.modifyMegaPrompt(template, {
      userProfile: userProfile as UserProfile,
      inputFilter: options.inputFilter as InputFilter,
      variables: options.customVariables,
      customInstructions: options.customInstructions,
    });

    // Analyze variable replacements
    const variableReplacements = this.analyzeVariableReplacements(
      template.mega_prompt,
      testPrompt,
      options.customVariables || {}
    );

    // Analyze conditional blocks
    const conditionalBlocks = this.analyzeConditionalBlocks(
      template.mega_prompt,
      testPrompt
    );

    // Extract variables used
    const variablesUsed = this.extractVariablesUsed(testPrompt);

    return {
      success: validationResult.valid,
      renderedPrompt: testPrompt,
      validationResult: {
        valid: validationResult.valid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      },
      variableReplacements,
      conditionalBlocks,
      metadata: {
        templateId,
        variablesUsed,
        conditionalsEvaluated: conditionalBlocks.rendered.length + conditionalBlocks.skipped.length,
        promptLength: testPrompt.length,
      },
    };
  }

  /**
   * Analyze variable replacements
   */
  private analyzeVariableReplacements(
    originalPrompt: string,
    renderedPrompt: string,
    customVariables: Record<string, any>
  ): Record<string, { expected: string; actual: string; replaced: boolean }> {
    const replacements: Record<string, { expected: string; actual: string; replaced: boolean }> = {};

    // Find all variables in original prompt
    const variablePattern = /\{\{(\w+)(?:\|default:([^}]+))?\}\}/g;
    let match;

    while ((match = variablePattern.exec(originalPrompt)) !== null) {
      const varName = match[1];
      const defaultValue = match[2]?.trim();
      const expectedValue = customVariables[varName] ?? defaultValue ?? '';

      // Check if variable was replaced
      const placeholder = match[0];
      const wasReplaced = !renderedPrompt.includes(placeholder);
      const actualValue = wasReplaced
        ? this.findVariableValueInPrompt(renderedPrompt, varName, expectedValue)
        : 'NOT_REPLACED';

      replacements[varName] = {
        expected: String(expectedValue),
        actual: actualValue,
        replaced: wasReplaced,
      };
    }

    return replacements;
  }

  /**
   * Find variable value in rendered prompt
   */
  private findVariableValueInPrompt(
    prompt: string,
    varName: string,
    expectedValue: any
  ): string {
    // Try to find the value near the variable name
    const contextPattern = new RegExp(
      `(${varName}[\\s:=]+)([^\\n]+)`,
      'i'
    );
    const match = prompt.match(contextPattern);
    if (match) {
      return match[2].trim();
    }

    // Fallback: check if expected value appears
    if (prompt.includes(String(expectedValue))) {
      return String(expectedValue);
    }

    return 'VALUE_NOT_FOUND';
  }

  /**
   * Analyze conditional blocks
   */
  private analyzeConditionalBlocks(
    originalPrompt: string,
    renderedPrompt: string
  ): {
    rendered: string[];
    skipped: string[];
  } {
    const rendered: string[] = [];
    const skipped: string[] = [];

    // Find all conditional blocks in original
    const ifPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    let match;

    while ((match = ifPattern.exec(originalPrompt)) !== null) {
      const condition = match[1];
      const blockContent = match[2];

      // Check if block content appears in rendered prompt
      const wasRendered = renderedPrompt.includes(blockContent.trim());
      if (wasRendered) {
        rendered.push(condition);
      } else {
        skipped.push(condition);
      }
    }

    // Find unless blocks
    const unlessPattern = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
    while ((match = unlessPattern.exec(originalPrompt)) !== null) {
      const condition = match[1];
      const blockContent = match[2];

      const wasRendered = renderedPrompt.includes(blockContent.trim());
      if (wasRendered) {
        rendered.push(`unless_${condition}`);
      } else {
        skipped.push(`unless_${condition}`);
      }
    }

    return { rendered, skipped };
  }

  /**
   * Extract variables used in prompt
   */
  private extractVariablesUsed(prompt: string): string[] {
    const variables = new Set<string>();
    const pattern = /\{\{(\w+)(?:\|[^}]+)?\}\}/g;
    let match;

    while ((match = pattern.exec(prompt)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Compare two prompts (for diff view)
   */
  comparePrompts(
    prompt1: string,
    prompt2: string
  ): {
    added: string[];
    removed: string[];
    changed: Array<{ line: string; old: string; new: string }>;
    similarity: number;
  } {
    const lines1 = prompt1.split('\n');
    const lines2 = prompt2.split('\n');

    const added: string[] = [];
    const removed: string[] = [];
    const changed: Array<{ line: string; old: string; new: string }> = [];

    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === undefined) {
        added.push(line2);
      } else if (line2 === undefined) {
        removed.push(line1);
      } else if (line1 !== line2) {
        changed.push({
          line: `Line ${i + 1}`,
          old: line1,
          new: line2,
        });
      }
    }

    // Calculate similarity (simple word-based)
    const words1 = new Set(prompt1.toLowerCase().split(/\s+/));
    const words2 = new Set(prompt2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    const similarity = union.size > 0 ? intersection.size / union.size : 0;

    return {
      added,
      removed,
      changed,
      similarity,
    };
  }
}

export const templateTestingService = new TemplateTestingService();
