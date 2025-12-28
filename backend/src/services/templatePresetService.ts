/**
 * Template Preset Service
 * 
 * Manages template presets for quick-start configurations
 */

import { createClient } from '@supabase/supabase-js';
import { scaffoldTemplateService } from './scaffoldTemplateService.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TemplatePreset {
  id: string;
  name: string;
  description?: string;
  category: string;
  template_ids: string[];
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  is_system_preset: boolean;
  created_by?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export class TemplatePresetService {
  /**
   * Get all presets
   */
  async getPresets(options: {
    category?: string;
    includeSystem?: boolean;
    userId?: string;
  } = {}): Promise<TemplatePreset[]> {
    let query = supabase.from('template_presets').select('*');

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.userId) {
      query = query.or(`is_system_preset.eq.true,created_by.eq.${options.userId}`);
    } else if (options.includeSystem !== false) {
      // Include system presets by default
      query = query.eq('is_system_preset', true);
    }

    const { data, error } = await query.order('usage_count', { ascending: false });

    if (error) {
      throw new Error(`Failed to get presets: ${error.message}`);
    }

    return (data || []) as TemplatePreset[];
  }

  /**
   * Create a preset
   */
  async createPreset(
    userId: string,
    preset: {
      name: string;
      description?: string;
      category: string;
      templateIds: string[];
      customVariables?: Record<string, any>;
      customInstructions?: string;
    }
  ): Promise<TemplatePreset> {
    // Validate template IDs
    for (const templateId of preset.templateIds) {
      const template = scaffoldTemplateService.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
    }

    const { data, error } = await supabase
      .from('template_presets')
      .insert({
        name: preset.name,
        description: preset.description,
        category: preset.category,
        template_ids: preset.templateIds,
        custom_variables: preset.customVariables || {},
        custom_instructions: preset.customInstructions,
        is_system_preset: false,
        created_by: userId,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create preset: ${error.message}`);
    }

    return data as TemplatePreset;
  }

  /**
   * Apply preset to user's customizations
   */
  async applyPreset(
    userId: string,
    presetId: string
  ): Promise<{ applied: string[]; failed: string[] }> {
    // Get preset
    const { data: preset, error: presetError } = await supabase
      .from('template_presets')
      .select('*')
      .eq('id', presetId)
      .single();

    if (presetError || !preset) {
      throw new Error('Preset not found');
    }

    const applied: string[] = [];
    const failed: string[] = [];

    // Apply preset to each template
    for (const templateId of preset.template_ids) {
      try {
        const template = scaffoldTemplateService.getTemplate(templateId);
        if (!template) {
          failed.push(templateId);
          continue;
        }

        // Create or update customization
        const { error: upsertError } = await supabase
          .from('user_template_customizations')
          .upsert(
            {
              user_id: userId,
              template_id: templateId,
              milestone: template.milestone,
              custom_variables: {
                ...preset.custom_variables,
              },
              custom_instructions: preset.custom_instructions,
              enabled: true,
            },
            {
              onConflict: 'user_id,template_id',
            }
          );

        if (upsertError) {
          failed.push(templateId);
        } else {
          applied.push(templateId);
        }
      } catch (error) {
        logger.warn(`Failed to apply preset to ${templateId}`, error as Error);
        failed.push(templateId);
      }
    }

    // Increment usage count
    await supabase
      .from('template_presets')
      .update({
        usage_count: (preset.usage_count || 0) + 1,
      })
      .eq('id', presetId);

    return { applied, failed };
  }

  /**
   * Create system presets (run once)
   */
  async createSystemPresets(): Promise<void> {
    const systemPresets = [
      {
        name: 'Full-Stack Quick Start',
        description: 'Complete setup for full-stack application',
        category: 'quick-start',
        template_ids: [
          'init-project-structure',
          'init-env-config',
          'init-typescript-config',
          'auth-jwt-middleware',
          'api-route-structure',
        ],
        custom_variables: {
          project_type: 'fullstack',
        },
      },
      {
        name: 'Security-First Setup',
        description: 'Templates focused on security best practices',
        category: 'scenario',
        template_ids: [
          'auth-jwt-middleware',
          'auth-rbac-middleware',
          'security-headers',
          'security-csrf-protection',
          'security-input-sanitization',
        ],
        custom_variables: {
          security_focus: true,
        },
        custom_instructions: 'Prioritize security in all implementations',
      },
      {
        name: 'Performance Optimized',
        description: 'Templates optimized for performance',
        category: 'scenario',
        template_ids: [
          'perf-caching-strategy',
          'perf-compression',
          'perf-database-query-optimization',
          'perf-frontend-code-splitting',
        ],
        custom_variables: {
          performance_focus: true,
        },
      },
      {
        name: 'Express + Supabase',
        description: 'Express backend with Supabase database',
        category: 'stack',
        template_ids: [
          'init-project-structure',
          'auth-jwt-middleware',
          'api-route-structure',
          'db-rls-policies',
        ],
        custom_variables: {
          framework: { express: true },
          database: { supabase: true },
        },
      },
    ];

    for (const preset of systemPresets) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('template_presets')
        .select('id')
        .eq('name', preset.name)
        .eq('is_system_preset', true)
        .single();

      if (!existing) {
        await supabase.from('template_presets').insert({
          ...preset,
          is_system_preset: true,
          usage_count: 0,
        });
      }
    }
  }

  /**
   * Update preset
   */
  async updatePreset(
    userId: string,
    presetId: string,
    updates: {
      name?: string;
      description?: string;
      category?: string;
      templateIds?: string[];
      customVariables?: Record<string, any>;
      customInstructions?: string;
    }
  ): Promise<TemplatePreset> {
    // Verify ownership
    const { data: preset, error: checkError } = await supabase
      .from('template_presets')
      .select('created_by, is_system_preset')
      .eq('id', presetId)
      .single();

    if (checkError || !preset) {
      throw new Error('Preset not found');
    }

    if (preset.is_system_preset) {
      throw new Error('Cannot update system presets');
    }

    if (preset.created_by !== userId) {
      throw new Error('You do not have permission to update this preset');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.templateIds !== undefined) updateData.template_ids = updates.templateIds;
    if (updates.customVariables !== undefined)
      updateData.custom_variables = updates.customVariables;
    if (updates.customInstructions !== undefined)
      updateData.custom_instructions = updates.customInstructions;

    const { data, error } = await supabase
      .from('template_presets')
      .update(updateData)
      .eq('id', presetId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update preset: ${error.message}`);
    }

    return data as TemplatePreset;
  }

  /**
   * Delete preset
   */
  async deletePreset(userId: string, presetId: string): Promise<void> {
    // Verify ownership
    const { data: preset, error: checkError } = await supabase
      .from('template_presets')
      .select('created_by, is_system_preset')
      .eq('id', presetId)
      .single();

    if (checkError || !preset) {
      throw new Error('Preset not found');
    }

    if (preset.is_system_preset) {
      throw new Error('Cannot delete system presets');
    }

    if (preset.created_by !== userId) {
      throw new Error('You do not have permission to delete this preset');
    }

    const { error } = await supabase.from('template_presets').delete().eq('id', presetId);

    if (error) {
      throw new Error(`Failed to delete preset: ${error.message}`);
    }
  }
}

export const templatePresetService = new TemplatePresetService();
