/**
 * Filter Combination Generator
 * 
 * Generates all possible filter combinations for comprehensive testing
 */

import type { InputFilter } from '../../backend/src/types/filters.js';

export interface FilterCombination {
  name: string;
  filter: InputFilter;
  description: string;
}

/**
 * Generate all possible filter combinations
 */
export function generateFilterCombinations(): FilterCombination[] {
  const combinations: FilterCombination[] = [];

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

  const outputFormats: InputFilter['outputFormat'][] = [
    'markdown',
    'json',
    'code',
    'plain_text',
    'structured_prompt',
    'provider_native',
  ];

  const tones: InputFilter['tone'][] = [
    'playful',
    'serious',
    'technical',
    'casual',
    'balanced',
  ];

  // Single filter combinations
  for (const style of styles) {
    combinations.push({
      name: `style_${style}`,
      filter: { style },
      description: `Style filter: ${style}`,
    });
  }

  for (const format of outputFormats) {
    combinations.push({
      name: `format_${format}`,
      filter: { outputFormat: format },
      description: `Output format: ${format}`,
    });
  }

  for (const tone of tones) {
    combinations.push({
      name: `tone_${tone}`,
      filter: { tone },
      description: `Tone: ${tone}`,
    });
  }

  // Style + Format combinations
  for (const style of styles) {
    for (const format of outputFormats) {
      combinations.push({
        name: `style_${style}_format_${format}`,
        filter: { style, outputFormat: format },
        description: `Style: ${style}, Format: ${format}`,
      });
    }
  }

  // Style + Tone combinations
  for (const style of styles) {
    for (const tone of tones) {
      combinations.push({
        name: `style_${style}_tone_${tone}`,
        filter: { style, tone },
        description: `Style: ${style}, Tone: ${tone}`,
      });
    }
  }

  // Format + Tone combinations
  for (const format of outputFormats) {
    for (const tone of tones) {
      combinations.push({
        name: `format_${format}_tone_${tone}`,
        filter: { outputFormat: format, tone },
        description: `Format: ${format}, Tone: ${tone}`,
      });
    }
  }

  // Triple combinations (most common)
  const commonStyles = ['technical', 'detailed', 'concise'];
  const commonFormats = ['code', 'markdown', 'json'];
  const commonTones = ['serious', 'technical', 'balanced'];

  for (const style of commonStyles) {
    for (const format of commonFormats) {
      for (const tone of commonTones) {
        combinations.push({
          name: `style_${style}_format_${format}_tone_${tone}`,
          filter: { style, outputFormat: format, tone },
          description: `Style: ${style}, Format: ${format}, Tone: ${tone}`,
        });
      }
    }
  }

  // Full combinations with all flags
  combinations.push({
    name: 'full_technical',
    filter: {
      style: 'technical',
      outputFormat: 'code',
      tone: 'serious',
      usePromptEngineering: true,
      useProviderGuidelines: true,
    },
    description: 'Full technical combination with all flags',
  });

  combinations.push({
    name: 'full_detailed',
    filter: {
      style: 'detailed',
      outputFormat: 'markdown',
      tone: 'balanced',
      usePromptEngineering: true,
    },
    description: 'Full detailed combination',
  });

  return combinations;
}

/**
 * Generate natural language input variations
 */
export function generateNaturalLanguageInputs(baseTask: string): string[] {
  const variations = [
    // Direct requests
    baseTask,
    `I need to ${baseTask}`,
    `Can you help me ${baseTask}?`,
    `Please ${baseTask}`,
    `Help me ${baseTask}`,

    // Question forms
    `How do I ${baseTask}?`,
    `What's the best way to ${baseTask}?`,
    `Can you show me how to ${baseTask}?`,

    // Imperative forms
    `Create ${baseTask}`,
    `Build ${baseTask}`,
    `Implement ${baseTask}`,
    `Setup ${baseTask}`,
    `Scaffold ${baseTask}`,
    `Generate ${baseTask}`,
    `Make ${baseTask}`,

    // With context
    `I want to ${baseTask} for my project`,
    `I'm working on ${baseTask}`,
    `Need to ${baseTask} asap`,
    `Looking to ${baseTask}`,

    // With requirements
    `Setup ${baseTask} with security in mind`,
    `Create ${baseTask} following best practices`,
    `Implement ${baseTask} for production`,
    `Build ${baseTask} with TypeScript`,
    `Generate ${baseTask} with proper error handling`,

    // Casual
    `Hey, can you ${baseTask}?`,
    `I'd like to ${baseTask}`,
    `Want to ${baseTask}`,

    // Formal
    `I would like to request assistance with ${baseTask}`,
    `Please provide guidance on ${baseTask}`,
    `Could you assist me in ${baseTask}?`,

    // With urgency
    `Urgently need to ${baseTask}`,
    `ASAP: ${baseTask}`,
    `Priority: ${baseTask}`,

    // With constraints
    `Setup ${baseTask} but keep it simple`,
    `Create ${baseTask} optimized for performance`,
    `Build ${baseTask} that's secure and fast`,
  ];

  return variations;
}

/**
 * Generate user profile variations
 */
export function generateUserProfileVariations(): Array<{ name: string; profile: any }> {
  return [
    {
      name: 'minimal',
      profile: {
        role: 'developer',
        stack: {},
      },
    },
    {
      name: 'backend_engineer_express',
      profile: {
        role: 'staff_engineer',
        stack: { express: true, postgresql: true },
      },
    },
    {
      name: 'fullstack_nextjs_supabase',
      profile: {
        role: 'founder',
        stack: { nextjs: true, supabase: true },
        company_context: 'SaaS startup',
      },
    },
    {
      name: 'devops_focused',
      profile: {
        role: 'devops',
        stack: { express: true },
        brand_voice: 'Clear and concise',
      },
    },
    {
      name: 'pm_with_context',
      profile: {
        role: 'pm',
        stack: {},
        company_context: 'Enterprise software company',
        brand_voice: 'Professional and friendly',
      },
    },
    {
      name: 'complete_profile',
      profile: {
        role: 'staff_engineer',
        stack: { express: true, supabase: true, nextjs: true },
        company_context: 'E-commerce platform serving 1M+ users',
        brand_voice: 'Technical but accessible',
        vertical: 'software',
      },
    },
  ];
}
