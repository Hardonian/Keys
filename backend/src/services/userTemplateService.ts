/**
 * User Template Service
 * 
 * Manages user customizations of mega prompt templates.
 * Serves default base templates initially, then customized versions after user modifications.
 */

import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '../types/index.js';
import { scaffoldTemplateService } from './scaffoldTemplateService.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserTemplateCustomization {
  id: string;
  user_id: string;
  template_id: string;
  milestone: string;
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplatePreview {
  templateId: string;
  milestone: string;
  name: string;
  description: string;
  basePrompt: string; // Default base template
  customizedPrompt?: string; // User's customized version (if exists)
  hasCustomization: boolean;
  customVariables?: Record<string, any>;
  customInstructions?: string;
}

export class UserTemplateService {
  /**
   * Get template preview with base and customized versions
   */
  async getTemplatePreview(
    userId: string,
    templateId: string
  ): Promise<TemplatePreview> {
    // Get base template
    const template = scaffoldTemplateService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get user customization if exists
    const { data: customization } = await supabase
      .from('user_template_customizations')
      .select('*')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .single();

    // Get user profile for default variable values
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Generate base prompt (with user profile defaults, no customizations)
    const basePrompt = scaffoldTemplateService.modifyMegaPrompt(template, {
      userProfile: profile as UserProfile,
    });

    // Generate customized prompt if customization exists
    let customizedPrompt: string | undefined;
    if (customization && customization.enabled) {
      customizedPrompt = scaffoldTemplateService.modifyMegaPrompt(template, {
        userProfile: profile as UserProfile,
        variables: {
          ...customization.custom_variables,
        },
        customInstructions: customization.custom_instructions,
      });
    }

    return {
      templateId: template.id,
      milestone: template.milestone,
      name: template.name,
      description: template.description,
      basePrompt,
      customizedPrompt,
      hasCustomization: !!customization,
      customVariables: customization?.custom_variables,
      customInstructions: customization?.custom_instructions,
    };
  }

  /**
   * Get all templates for a milestone with previews
   */
  async getMilestoneTemplates(
    userId: string,
    milestone: string
  ): Promise<TemplatePreview[]> {
    const templates = scaffoldTemplateService.filterTemplates({
      milestone: [milestone],
    });

    const previews: TemplatePreview[] = [];

    for (const template of templates) {
      try {
        const preview = await this.getTemplatePreview(userId, template.id);
        previews.push(preview);
      } catch (error) {
        logger.warn(`Failed to get preview for ${template.id}`, error as Error);
      }
    }

    return previews;
  }

  /**
   * Save user customization
   */
  async saveCustomization(
    userId: string,
    templateId: string,
    customVariables: Record<string, any>,
    customInstructions?: string
  ): Promise<UserTemplateCustomization> {
    // Verify template exists
    const template = scaffoldTemplateService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Upsert customization
    const { data, error } = await supabase
      .from('user_template_customizations')
      .upsert(
        {
          user_id: userId,
          template_id: templateId,
          milestone: template.milestone,
          custom_variables: customVariables,
          custom_instructions: customInstructions,
          enabled: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,template_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save customization: ${error.message}`);
    }

    return data as UserTemplateCustomization;
  }

  /**
   * Update customization
   */
  async updateCustomization(
    userId: string,
    templateId: string,
    updates: {
      customVariables?: Record<string, any>;
      customInstructions?: string;
      enabled?: boolean;
    }
  ): Promise<UserTemplateCustomization> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.customVariables !== undefined) {
      updateData.custom_variables = updates.customVariables;
    }

    if (updates.customInstructions !== undefined) {
      updateData.custom_instructions = updates.customInstructions;
    }

    if (updates.enabled !== undefined) {
      updateData.enabled = updates.enabled;
    }

    const { data, error } = await supabase
      .from('user_template_customizations')
      .update(updateData)
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update customization: ${error.message}`);
    }

    return data as UserTemplateCustomization;
  }

  /**
   * Delete customization (revert to base)
   */
  async deleteCustomization(
    userId: string,
    templateId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_template_customizations')
      .delete()
      .eq('user_id', userId)
      .eq('template_id', templateId);

    if (error) {
      throw new Error(`Failed to delete customization: ${error.message}`);
    }
  }

  /**
   * Get user's customized prompt for a template
   * Returns customized version if exists, otherwise base version
   */
  async getUserTemplatePrompt(
    userId: string,
    templateId: string,
    taskDescription: string,
    inputFilter?: any
  ): Promise<{
    prompt: string;
    isCustomized: boolean;
    templateId: string;
  }> {
    // Get template
    const template = scaffoldTemplateService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get customization
    const { data: customization } = await supabase
      .from('user_template_customizations')
      .select('*')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .eq('enabled', true)
      .single();

    // Generate prompt with customization if exists
    const prompt = scaffoldTemplateService.modifyMegaPrompt(template, {
      userProfile: profile as UserProfile,
      inputFilter,
      variables: customization?.custom_variables,
      customInstructions: customization?.custom_instructions,
    });

    return {
      prompt,
      isCustomized: !!customization,
      templateId: template.id,
    };
  }

  /**
   * Get all user customizations
   */
  async getUserCustomizations(userId: string): Promise<UserTemplateCustomization[]> {
    const { data, error } = await supabase
      .from('user_template_customizations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get customizations: ${error.message}`);
    }

    return (data || []) as UserTemplateCustomization[];
  }

  /**
   * Reset all customizations for a user
   */
  async resetAllCustomizations(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_template_customizations')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to reset customizations: ${error.message}`);
    }
  }
}

export const userTemplateService = new UserTemplateService();
