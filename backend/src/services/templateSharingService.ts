/**
 * Template Sharing Service
 * 
 * Manages sharing of template customizations with teams and public marketplace
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SharedTemplate {
  id: string;
  owner_id: string;
  template_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  shared_with_user_ids: string[];
  shared_with_team_ids: string[];
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  usage_count: number;
  rating_average?: number;
  created_at: string;
  updated_at: string;
}

export class TemplateSharingService {
  /**
   * Share a template customization
   */
  async shareTemplate(
    userId: string,
    templateId: string,
    options: {
      name: string;
      description?: string;
      isPublic?: boolean;
      sharedWithUserIds?: string[];
      sharedWithTeamIds?: string[];
    }
  ): Promise<SharedTemplate> {
    // Get user's customization
    const { data: customization, error: customizationError } = await supabase
      .from('user_template_customizations')
      .select('*')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .single();

    if (customizationError || !customization) {
      throw new Error('Template customization not found');
    }

    // Create shared template
    const { data, error } = await supabase
      .from('shared_template_customizations')
      .insert({
        owner_id: userId,
        template_id: templateId,
        name: options.name,
        description: options.description,
        is_public: options.isPublic || false,
        shared_with_user_ids: options.sharedWithUserIds || [],
        shared_with_team_ids: options.sharedWithTeamIds || [],
        custom_variables: customization.custom_variables,
        custom_instructions: customization.custom_instructions,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to share template: ${error.message}`);
    }

    return data as SharedTemplate;
  }

  /**
   * Get shared templates available to user
   */
  async getAvailableSharedTemplates(
    userId: string,
    options: {
      templateId?: string;
      isPublic?: boolean;
      ownerId?: string;
    } = {}
  ): Promise<SharedTemplate[]> {
    let query = supabase
      .from('shared_template_customizations')
      .select('*');

    // Filter by template ID if provided
    if (options.templateId) {
      query = query.eq('template_id', options.templateId);
    }

    // Filter by public or user-specific
    if (options.isPublic !== undefined) {
      if (options.isPublic) {
        query = query.eq('is_public', true);
      } else {
        // User-specific shares
        query = query.or(
          `owner_id.eq.${userId},shared_with_user_ids.cs.{${userId}}`
        );
      }
    } else {
      // Get all available to user
      query = query.or(
        `is_public.eq.true,owner_id.eq.${userId},shared_with_user_ids.cs.{${userId}}`
      );
    }

    // Filter by owner if provided
    if (options.ownerId) {
      query = query.eq('owner_id', options.ownerId);
    }

    const { data, error } = await query.order('usage_count', { ascending: false });

    if (error) {
      throw new Error(`Failed to get shared templates: ${error.message}`);
    }

    return (data || []) as SharedTemplate[];
  }

  /**
   * Clone a shared template to user's customizations
   */
  async cloneSharedTemplate(
    userId: string,
    sharedTemplateId: string
  ): Promise<void> {
    // Get shared template
    const { data: sharedTemplate, error: sharedError } = await supabase
      .from('shared_template_customizations')
      .select('*')
      .eq('id', sharedTemplateId)
      .single();

    if (sharedError || !sharedTemplate) {
      throw new Error('Shared template not found');
    }

    // Check if user has access
    const hasAccess =
      sharedTemplate.is_public ||
      sharedTemplate.owner_id === userId ||
      sharedTemplate.shared_with_user_ids.includes(userId);

    if (!hasAccess) {
      throw new Error('You do not have access to this shared template');
    }

    // Get template milestone
    const { scaffoldTemplateService } = await import('./scaffoldTemplateService.js');
    const template = scaffoldTemplateService.getTemplate(sharedTemplate.template_id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create user customization from shared template
    const { error: insertError } = await supabase
      .from('user_template_customizations')
      .upsert(
        {
          user_id: userId,
          template_id: sharedTemplate.template_id,
          milestone: template.milestone,
          custom_variables: sharedTemplate.custom_variables,
          custom_instructions: sharedTemplate.custom_instructions,
          enabled: true,
        },
        {
          onConflict: 'user_id,template_id',
        }
      );

    if (insertError) {
      throw new Error(`Failed to clone template: ${insertError.message}`);
    }

    // Increment usage count
    await supabase
      .from('shared_template_customizations')
      .update({
        usage_count: (sharedTemplate.usage_count || 0) + 1,
      })
      .eq('id', sharedTemplateId);
  }

  /**
   * Update shared template
   */
  async updateSharedTemplate(
    userId: string,
    sharedTemplateId: string,
    updates: {
      name?: string;
      description?: string;
      isPublic?: boolean;
      sharedWithUserIds?: string[];
      sharedWithTeamIds?: string[];
    }
  ): Promise<SharedTemplate> {
    // Verify ownership
    const { data: sharedTemplate, error: checkError } = await supabase
      .from('shared_template_customizations')
      .select('owner_id')
      .eq('id', sharedTemplateId)
      .single();

    if (checkError || !sharedTemplate || sharedTemplate.owner_id !== userId) {
      throw new Error('You do not have permission to update this shared template');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.sharedWithUserIds !== undefined)
      updateData.shared_with_user_ids = updates.sharedWithUserIds;
    if (updates.sharedWithTeamIds !== undefined)
      updateData.shared_with_team_ids = updates.sharedWithTeamIds;

    const { data, error } = await supabase
      .from('shared_template_customizations')
      .update(updateData)
      .eq('id', sharedTemplateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update shared template: ${error.message}`);
    }

    return data as SharedTemplate;
  }

  /**
   * Delete shared template
   */
  async deleteSharedTemplate(userId: string, sharedTemplateId: string): Promise<void> {
    // Verify ownership
    const { data: sharedTemplate, error: checkError } = await supabase
      .from('shared_template_customizations')
      .select('owner_id')
      .eq('id', sharedTemplateId)
      .single();

    if (checkError || !sharedTemplate || sharedTemplate.owner_id !== userId) {
      throw new Error('You do not have permission to delete this shared template');
    }

    const { error } = await supabase
      .from('shared_template_customizations')
      .delete()
      .eq('id', sharedTemplateId);

    if (error) {
      throw new Error(`Failed to delete shared template: ${error.message}`);
    }
  }
}

export const templateSharingService = new TemplateSharingService();
