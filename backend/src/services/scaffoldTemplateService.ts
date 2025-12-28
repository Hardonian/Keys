/**
 * Scaffold Template Service
 * 
 * Manages mega prompt templates that serve as static bases for dynamic modification.
 * Templates are comprehensive prompts that get modified with user inputs and filters.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';
import type { UserProfile } from '../types/index.js';
import type { InputFilter } from '../types/filters.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  default?: string;
  type?: string;
  examples?: string[];
}

interface ScaffoldTemplate {
  id: string;
  milestone: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  tags: string[];
  stack: string[];
  security_level: 'required' | 'recommended' | 'optional';
  optimization_level: 'required' | 'recommended' | 'optional';
  mega_prompt: string; // The static mega prompt template
  variables?: TemplateVariable[];
}

interface TemplateFilter {
  milestone?: string[];
  stack?: string[];
  priority?: 'high' | 'medium' | 'low';
  security_level?: 'required' | 'recommended' | 'optional';
  optimization_level?: 'required' | 'recommended' | 'optional';
  tags?: string[];
  exclude_tags?: string[];
}

interface PromptModificationConfig {
  userProfile?: UserProfile;
  inputFilter?: InputFilter;
  variables?: Record<string, any>;
  customInstructions?: string;
}

export class ScaffoldTemplateService {
  private templates: Map<string, ScaffoldTemplate> = new Map();
  private catalog: any;

  /**
   * Get all loaded templates (for testing)
   */
  getAllTemplates(): Map<string, ScaffoldTemplate> {
    return this.templates;
  }

  /**
   * Get all template IDs
   */
  getAllTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  constructor() {
    this.loadCatalog();
    this.loadTemplates();
  }

  /**
   * Load template catalog
   */
  private loadCatalog() {
    try {
      const catalogPath = join(__dirname, '../../templates/catalog.json');
      if (!existsSync(catalogPath)) {
        logger.warn('Template catalog not found, templates will not be available');
        this.catalog = { milestones: {} };
        return;
      }
      const catalogContent = readFileSync(catalogPath, 'utf-8');
      this.catalog = JSON.parse(catalogContent);
    } catch (error) {
      logger.error('Failed to load template catalog', error as Error);
      this.catalog = { milestones: {} };
    }
  }

  /**
   * Load all template files
   */
  private loadTemplates() {
    try {
      const templatesDir = join(__dirname, '../../templates/milestones');
      const milestones = this.catalog.milestones || {};

      for (const [milestoneId, milestoneData] of Object.entries(milestones as Record<string, any>)) {
        for (const templateMeta of milestoneData.templates || []) {
          try {
            // Try .prompt.yaml first (mega prompt), then .yaml (legacy)
            const promptPath = join(
              templatesDir,
              milestoneId,
              `${templateMeta.id}.prompt.yaml`
            );
            const legacyPath = join(
              templatesDir,
              milestoneId,
              `${templateMeta.id}.yaml`
            );

            let templatePath: string | null = null;
            if (existsSync(promptPath)) {
              templatePath = promptPath;
            } else if (existsSync(legacyPath)) {
              templatePath = legacyPath;
            }

            if (templatePath) {
              const templateContent = readFileSync(templatePath, 'utf-8');
              const template = yaml.load(templateContent) as ScaffoldTemplate;
              
              // Validate template matches catalog
              if (template && template.id === templateMeta.id) {
                // Ensure mega_prompt exists (use content as fallback for legacy)
                if (!template.mega_prompt && (template as any).content) {
                  template.mega_prompt = (template as any).content;
                }
                this.templates.set(template.id, template);
              }
            } else {
              logger.debug(`Template file not found: ${templateMeta.id}, skipping`);
            }
          } catch (fileError: any) {
            logger.warn(`Failed to load template ${templateMeta.id}`, fileError as Error);
          }
        }
      }

      logger.info(`Loaded ${this.templates.size} scaffold templates`);
    } catch (error) {
      logger.error('Failed to load templates', error as Error);
    }
  }

  /**
   * Filter templates based on criteria
   */
  filterTemplates(filter: TemplateFilter): ScaffoldTemplate[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const securityOrder = { required: 3, recommended: 2, optional: 1 };
    const optimizationOrder = { required: 3, recommended: 2, optional: 1 };

    const minPriority = filter.priority ? priorityOrder[filter.priority] : 1;
    const minSecurity = filter.security_level ? securityOrder[filter.security_level] : 1;
    const minOptimization = filter.optimization_level
      ? optimizationOrder[filter.optimization_level]
      : 1;

    const results: ScaffoldTemplate[] = [];

    for (const template of this.templates.values()) {
      // Filter by milestone
      if (filter.milestone && filter.milestone.length > 0) {
        if (!filter.milestone.includes(template.milestone)) {
          continue;
        }
      }

      // Filter by priority
      if (priorityOrder[template.priority] < minPriority) {
        continue;
      }

      // Filter by security level
      if (securityOrder[template.security_level] < minSecurity) {
        continue;
      }

      // Filter by optimization level
      if (optimizationOrder[template.optimization_level] < minOptimization) {
        continue;
      }

      // Filter by stack
      if (filter.stack && filter.stack.length > 0) {
        const hasStackMatch = filter.stack.some((s) =>
          template.stack.some((ts) =>
            ts.toLowerCase().includes(s.toLowerCase())
          )
        );
        if (!hasStackMatch) {
          continue;
        }
      }

      // Filter by tags (all must match)
      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every((tag) =>
          template.tags.some((tt) => tt.toLowerCase() === tag.toLowerCase())
        );
        if (!hasAllTags) {
          continue;
        }
      }

      // Exclude by tags
      if (filter.exclude_tags && filter.exclude_tags.length > 0) {
        const hasExcludedTag = filter.exclude_tags.some((tag) =>
          template.tags.some((tt) => tt.toLowerCase() === tag.toLowerCase())
        );
        if (hasExcludedTag) {
          continue;
        }
      }

      results.push(template);
    }

    return results;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ScaffoldTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Modify mega prompt template with user inputs and filters
   * This is the core function that transforms static templates into dynamic prompts
   */
  modifyMegaPrompt(
    template: ScaffoldTemplate,
    config: PromptModificationConfig
  ): string {
    let modifiedPrompt = template.mega_prompt;

    const {
      userProfile,
      inputFilter,
      variables = {},
      customInstructions,
    } = config;

    // Extract variables from user profile
    const profileVariables: Record<string, any> = {
      user_role: userProfile?.role || 'developer',
      company_context: userProfile?.company_context,
      brand_voice: userProfile?.brand_voice,
      experience_level: 'intermediate', // Could be inferred from profile
      project_type: 'fullstack',
    };

    // Extract stack variables from profile
    if (userProfile?.stack) {
      profileVariables.stack = {
        typescript: true,
        monorepo: false,
        frontend: userProfile.stack.nextjs || false,
        backend: true,
        frontend_framework: userProfile.stack.nextjs ? 'Next.js' : undefined,
        backend_framework: 'Express',
        database: userProfile.stack.supabase ? 'Supabase' : 'PostgreSQL',
      };
    }

    // Merge all variables
    const allVariables: Record<string, any> = {
      ...profileVariables,
      ...variables,
      custom_instructions: customInstructions,
      security_focus: true,
      performance_focus: true,
    };

    // Apply input filter modifications
    if (inputFilter && inputFilter.style) {
      (allVariables as Record<string, any>).style = {
        concise: inputFilter.style === 'concise',
        detailed: inputFilter.style === 'detailed',
        technical: inputFilter.style === 'technical',
      };
    }

    // Replace template variables using Handlebars-like syntax
    modifiedPrompt = this.replaceTemplateVariables(modifiedPrompt, allVariables);

    return modifiedPrompt;
  }

  /**
   * Replace template variables in mega prompt
   * Supports Handlebars-like syntax: {{variable}}, {{variable|default:value}}, {{#if condition}}
   */
  private replaceTemplateVariables(
    prompt: string,
    variables: Record<string, any>
  ): string {
    let result = prompt;

    // Replace {{variable|default:value}} patterns
    result = result.replace(/\{\{(\w+)\|default:([^}]+)\}\}/g, (match, varName, defaultValue) => {
      const value = variables[varName];
      return value !== undefined && value !== null ? String(value) : defaultValue.trim();
    });

    // Replace {{#if condition}} blocks
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = variables[condition];
      if (value && value !== false && value !== null && value !== undefined) {
        return content;
      }
      return '';
    });

    // Replace {{#unless condition}} blocks
    result = result.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, content) => {
      const value = variables[condition];
      if (!value || value === false || value === null || value === undefined) {
        return content;
      }
      return '';
    });

    // Replace nested object access {{object.property}}
    result = result.replace(/\{\{(\w+(?:\.\w+)+)\}\}/g, (match, path) => {
      const parts = path.split('.');
      let value = variables;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      return value !== undefined && value !== null ? String(value) : '';
    });

    // Replace simple {{variable}} patterns (after other replacements)
    result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return value !== undefined && value !== null ? String(value) : '';
    });

    return result;
  }

  /**
   * Generate scaffold prompt from templates
   * Combines multiple mega prompts and modifies them with user context
   */
  generateScaffoldPrompt(
    taskDescription: string,
    userProfile: UserProfile,
    selectedTemplates: string[],
    config?: PromptModificationConfig
  ): {
    systemPrompt: string;
    userPrompt: string;
    templates: ScaffoldTemplate[];
    modifiedPrompts: Record<string, string>;
  } {
    // Load selected templates
    const templates = selectedTemplates
      .map((id) => this.getTemplate(id))
      .filter((t): t is ScaffoldTemplate => t !== null);

    // Order by dependencies
    const orderedTemplates = this.orderByDependencies(templates);

    // Modify each template's mega prompt
    const modifiedPrompts: Record<string, string> = {};
    const modificationConfig: PromptModificationConfig = {
      userProfile,
      inputFilter: config?.inputFilter,
      variables: config?.variables,
      customInstructions: config?.customInstructions,
    };

    for (const template of orderedTemplates) {
      const modified = this.modifyMegaPrompt(template, modificationConfig);
      modifiedPrompts[template.id] = modified;
    }

    // Compose system prompt from modified mega prompts
    const systemPrompt = this.composeSystemPrompt(orderedTemplates, modifiedPrompts, userProfile);

    // Compose user prompt
    const userPrompt = this.composeUserPrompt(taskDescription, orderedTemplates, userProfile);

    return {
      systemPrompt,
      userPrompt,
      templates: orderedTemplates,
      modifiedPrompts,
    };
  }

  /**
   * Compose system prompt from modified mega prompts
   */
  private composeSystemPrompt(
    templates: ScaffoldTemplate[],
    modifiedPrompts: Record<string, string>,
    userProfile: UserProfile
  ): string {
    // Combine all modified mega prompts
    const promptParts: string[] = [];

    // Add base context
    promptParts.push(
      `You are an expert full-stack developer specializing in secure, optimized code scaffolding.\n`
    );
    promptParts.push(`User Role: ${userProfile.role || 'developer'}\n`);
    promptParts.push(`Project Stack: ${JSON.stringify(userProfile.stack || {})}\n\n`);

    // Add each template's modified mega prompt
    for (const template of templates) {
      const modifiedPrompt = modifiedPrompts[template.id];
      if (modifiedPrompt) {
        promptParts.push(`## ${template.name}\n\n`);
        promptParts.push(modifiedPrompt);
        promptParts.push(`\n\n---\n\n`);
      }
    }

    // Add final instructions
    promptParts.push(
      `\n## Final Instructions\n\n` +
      `Always prioritize:\n` +
      `1. Security best practices (input validation, authentication, authorization, RLS policies)\n` +
      `2. Performance optimization (caching, indexing, query optimization)\n` +
      `3. Code quality (type safety, error handling, logging)\n` +
      `4. Maintainability (clear structure, documentation, testing)\n`
    );

    return promptParts.join('');
  }

  /**
   * Compose user prompt from task and templates
   */
  private composeUserPrompt(
    taskDescription: string,
    templates: ScaffoldTemplate[],
    userProfile: UserProfile
  ): string {
    let prompt = `Task: ${taskDescription}\n\n`;

    prompt += `Implement the following components:\n\n`;

    for (const template of templates) {
      prompt += `- ${template.name}: ${template.description}\n`;
    }

    if (userProfile.company_context) {
      prompt += `\nCompany Context: ${userProfile.company_context}\n`;
    }

    if (userProfile.brand_voice) {
      prompt += `\nBrand Voice: ${userProfile.brand_voice}\n`;
    }

    return prompt;
  }

  /**
   * Order templates by dependencies
   */
  private orderByDependencies(
    templates: ScaffoldTemplate[]
  ): ScaffoldTemplate[] {
    const ordered: ScaffoldTemplate[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (templateId: string) => {
      if (visiting.has(templateId)) {
        throw new Error(`Circular dependency detected: ${templateId}`);
      }
      if (visited.has(templateId)) {
        return;
      }

      visiting.add(templateId);
      const template = templates.find((t) => t.id === templateId);

      if (template && template.dependencies) {
        for (const depId of template.dependencies) {
          const depTemplate = templates.find((t) => t.id === depId);
          if (depTemplate) {
            visit(depId);
          }
        }
      }

      visiting.delete(templateId);
      visited.add(templateId);

      const templateToAdd = templates.find((t) => t.id === templateId);
      if (templateToAdd && !ordered.includes(templateToAdd)) {
        ordered.push(templateToAdd);
      }
    };

    for (const template of templates) {
      visit(template.id);
    }

    return ordered;
  }

  /**
   * Get recommended templates for a project
   */
  getRecommendedTemplates(
    userProfile: UserProfile,
    taskDescription: string
  ): ScaffoldTemplate[] {
    // Extract stack from profile
    const stack: string[] = [];
    if (userProfile.stack) {
      if (userProfile.stack.nextjs) stack.push('nextjs');
      if (userProfile.stack.supabase) stack.push('supabase');
      if (userProfile.stack.code_repo) stack.push('express');
    }

    // Filter templates
    const filter: TemplateFilter = {
      stack: stack.length > 0 ? stack : undefined,
      priority: 'medium',
      security_level: 'recommended',
      optimization_level: 'recommended',
    };

    const templates = this.filterTemplates(filter);

    // Infer templates from task description
    const lowerTask = taskDescription.toLowerCase();
    const inferred: ScaffoldTemplate[] = [];

    if (lowerTask.includes('auth') || lowerTask.includes('login')) {
      const authTemplate = templates.find((t) => t.id === 'auth-jwt-middleware');
      if (authTemplate) inferred.push(authTemplate);
    }

    if (lowerTask.includes('database') || lowerTask.includes('schema') || lowerTask.includes('rls')) {
      const rlsTemplate = templates.find((t) => t.id === 'db-rls-policies');
      if (rlsTemplate) inferred.push(rlsTemplate);
    }

    if (lowerTask.includes('api') || lowerTask.includes('route') || lowerTask.includes('endpoint')) {
      const apiTemplates = templates.filter((t) => t.tags.includes('api'));
      inferred.push(...apiTemplates.slice(0, 3));
    }

    if (lowerTask.includes('security') || lowerTask.includes('secure')) {
      const securityTemplates = templates.filter((t) => t.tags.includes('security'));
      inferred.push(...securityTemplates);
    }

    // Combine and deduplicate
    const allTemplates = [...templates.slice(0, 5), ...inferred];
    const unique = Array.from(
      new Map(allTemplates.map((t) => [t.id, t])).values()
    );

    return this.orderByDependencies(unique);
  }
}

export const scaffoldTemplateService = new ScaffoldTemplateService();
