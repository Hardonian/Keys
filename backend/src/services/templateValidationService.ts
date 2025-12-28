/**
 * Template Validation Service
 * 
 * Validates template customizations against template schemas
 * Ensures variables are correct type and format
 */

import { scaffoldTemplateService } from './scaffoldTemplateService.js';
import { logger } from '../utils/logger.js';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export class TemplateValidationService {
  /**
   * Validate custom variables against template schema
   */
  validateCustomVariables(
    templateId: string,
    customVariables: Record<string, any>
  ): ValidationResult {
    const template = scaffoldTemplateService.getTemplate(templateId);
    if (!template) {
      return {
        valid: false,
        errors: [
          {
            field: 'templateId',
            message: `Template ${templateId} not found`,
            code: 'TEMPLATE_NOT_FOUND',
          },
        ],
        warnings: [],
      };
    }

    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validate variables exist in template
    const templateVariables = template.variables || [];
    const templateVarMap = new Map(
      templateVariables.map((v) => [v.name, v])
    );

    // Check for unknown variables
    for (const [varName, varValue] of Object.entries(customVariables)) {
      if (!templateVarMap.has(varName)) {
        warnings.push(
          `Variable "${varName}" is not defined in template. It may be ignored.`
        );
        continue;
      }

      const templateVar = templateVarMap.get(varName)!;

      // Validate required variables
      if (templateVar.required && (varValue === undefined || varValue === null)) {
        errors.push({
          field: varName,
          message: `Required variable "${varName}" is missing`,
          code: 'REQUIRED_VARIABLE_MISSING',
        });
        continue;
      }

      // Validate type if specified
      if (templateVar.type) {
        const typeError = this.validateType(varName, varValue, templateVar.type);
        if (typeError) {
          errors.push(typeError);
        }
      }

      // Validate against examples if provided
      if (templateVar.examples && templateVar.examples.length > 0) {
        if (!templateVar.examples.includes(varValue)) {
          warnings.push(
            `Variable "${varName}" value doesn't match any example. Examples: ${templateVar.examples.join(', ')}`
          );
        }
      }
    }

    // Check for missing required variables
    for (const templateVar of templateVariables) {
      if (
        templateVar.required &&
        !(templateVar.name in customVariables) &&
        !templateVar.default
      ) {
        errors.push({
          field: templateVar.name,
          message: `Required variable "${templateVar.name}" is missing`,
          code: 'REQUIRED_VARIABLE_MISSING',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate variable type
   */
  private validateType(
    varName: string,
    value: any,
    expectedType: string
  ): ValidationError | null {
    switch (expectedType.toLowerCase()) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field: varName,
            message: `Variable "${varName}" must be a string`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          return {
            field: varName,
            message: `Variable "${varName}" must be a number`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: varName,
            message: `Variable "${varName}" must be a boolean`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return {
            field: varName,
            message: `Variable "${varName}" must be an object`,
            code: 'INVALID_TYPE',
          };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return {
            field: varName,
            message: `Variable "${varName}" must be an array`,
            code: 'INVALID_TYPE',
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate template prompt syntax
   */
  validateTemplateSyntax(templateContent: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check for unclosed conditionals
    const ifMatches = templateContent.match(/\{\{#if\s+\w+\}\}/g) || [];
    const endifMatches = templateContent.match(/\{\{\/if\}\}/g) || [];

    if (ifMatches.length !== endifMatches.length) {
      errors.push({
        field: 'template',
        message: `Mismatched conditional blocks: ${ifMatches.length} {{#if}} but ${endifMatches.length} {{/if}}`,
        code: 'SYNTAX_ERROR',
      });
    }

    // Check for unclosed unless
    const unlessMatches = templateContent.match(/\{\{#unless\s+\w+\}\}/g) || [];
    const endUnlessMatches = templateContent.match(/\{\{\/unless\}\}/g) || [];

    if (unlessMatches.length !== endUnlessMatches.length) {
      errors.push({
        field: 'template',
        message: `Mismatched conditional blocks: ${unlessMatches.length} {{#unless}} but ${endUnlessMatches.length} {{/unless}}`,
        code: 'SYNTAX_ERROR',
      });
    }

    // Check for malformed variable syntax
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = variablePattern.exec(templateContent)) !== null) {
      const varContent = match[1];
      
      // Check for valid variable name pattern
      if (!/^[\w|.]+$/.test(varContent.replace(/\|default:[^|]+/g, ''))) {
        warnings.push(`Potentially malformed variable: ${match[0]}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate customization before save
   */
  validateCustomization(
    templateId: string,
    customVariables: Record<string, any>,
    customInstructions?: string
  ): ValidationResult {
    const variableValidation = this.validateCustomVariables(
      templateId,
      customVariables
    );

    const errors = [...variableValidation.errors];
    const warnings = [...variableValidation.warnings];

    // Validate custom instructions length
    if (customInstructions && customInstructions.length > 5000) {
      warnings.push('Custom instructions exceed 5000 characters');
    }

    // Validate custom instructions don't contain dangerous patterns
    if (customInstructions) {
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(customInstructions)) {
          warnings.push('Custom instructions contain potentially unsafe content');
          break;
        }
      }
    }

    return {
      valid: variableValidation.valid && errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get available variables for a template
   */
  getAvailableVariables(templateId: string): Array<{
    name: string;
    description: string;
    type?: string;
    required: boolean;
    default?: string;
    examples?: string[];
  }> {
    const template = scaffoldTemplateService.getTemplate(templateId);
    if (!template) {
      return [];
    }

    return (template.variables || []).map((v) => ({
      name: v.name,
      description: v.description,
      type: v.type,
      required: v.required || false,
      default: v.default,
      examples: v.examples,
    }));
  }
}

export const templateValidationService = new TemplateValidationService();
