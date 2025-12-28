/**
 * Template Export/Import Service
 * 
 * Handles export and import of template customizations
 */

import { createClient } from '@supabase/supabase-js';
import { scaffoldTemplateService } from './scaffoldTemplateService.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TemplateExport {
  version: string;
  exported_at: string;
  exported_by: string;
  customizations: Array<{
    template_id: string;
    template_name: string;
    milestone: string;
    custom_variables: Record<string, any>;
    custom_instructions?: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
  }>;
  metadata: {
    total_templates: number;
    export_format: string;
  };
}

export class TemplateExportService {
  /**
   * Export user's customizations
   */
  async exportUserCustomizations(
    userId: string,
    options: {
      templateIds?: string[];
      includeMetadata?: boolean;
    } = {}
  ): Promise<TemplateExport> {
    // Get user customizations
    let query = supabase
      .from('user_template_customizations')
      .select('*')
      .eq('user_id', userId);

    if (options.templateIds && options.templateIds.length > 0) {
      query = query.in('template_id', options.templateIds);
    }

    const { data: customizations, error } = await query.order('updated_at', {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to export customizations: ${error.message}`);
    }

    // Enrich with template names
    const enrichedCustomizations = (customizations || []).map((customization) => {
      const template = scaffoldTemplateService.getTemplate(customization.template_id);
      return {
        template_id: customization.template_id,
        template_name: template?.name || customization.template_id,
        milestone: customization.milestone,
        custom_variables: customization.custom_variables,
        custom_instructions: customization.custom_instructions,
        enabled: customization.enabled,
        created_at: customization.created_at,
        updated_at: customization.updated_at,
      };
    });

    // Get user info for metadata
    const { data: user } = await supabase.auth.admin.getUserById(userId);

    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      exported_by: user?.user?.email || userId,
      customizations: enrichedCustomizations,
      metadata: {
        total_templates: enrichedCustomizations.length,
        export_format: 'json',
      },
    };
  }

  /**
   * Import customizations from export
   */
  async importCustomizations(
    userId: string,
    exportData: TemplateExport,
    options: {
      overwriteExisting?: boolean;
      skipErrors?: boolean;
    } = {}
  ): Promise<{
    imported: string[];
    skipped: string[];
    errors: Array<{ templateId: string; error: string }>;
  }> {
    const imported: string[] = [];
    const skipped: string[] = [];
    const errors: Array<{ templateId: string; error: string }> = [];

    for (const customization of exportData.customizations) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from('user_template_customizations')
          .select('id')
          .eq('user_id', userId)
          .eq('template_id', customization.template_id)
          .single();

        if (existing && !options.overwriteExisting) {
          skipped.push(customization.template_id);
          continue;
        }

        // Verify template exists
        const template = scaffoldTemplateService.getTemplate(customization.template_id);
        if (!template) {
          if (options.skipErrors) {
            errors.push({
              templateId: customization.template_id,
              error: 'Template not found',
            });
            continue;
          }
          throw new Error(`Template ${customization.template_id} not found`);
        }

        // Import customization
        const { error: importError } = await supabase
          .from('user_template_customizations')
          .upsert(
            {
              user_id: userId,
              template_id: customization.template_id,
              milestone: customization.milestone || template.milestone,
              custom_variables: customization.custom_variables,
              custom_instructions: customization.custom_instructions,
              enabled: customization.enabled,
            },
            {
              onConflict: 'user_id,template_id',
            }
          );

        if (importError) {
          if (options.skipErrors) {
            errors.push({
              templateId: customization.template_id,
              error: importError.message,
            });
            continue;
          }
          throw importError;
        }

        imported.push(customization.template_id);
      } catch (error) {
        if (options.skipErrors) {
          errors.push({
            templateId: customization.template_id,
            error: error instanceof Error ? error.message : String(error),
          });
        } else {
          throw error;
        }
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Export to different formats
   */
  async exportToFormat(
    userId: string,
    format: 'json' | 'yaml' | 'csv',
    templateIds?: string[]
  ): Promise<string> {
    const exportData = await this.exportUserCustomizations(userId, { templateIds });

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);

      case 'yaml':
        const yaml = await import('js-yaml');
        return yaml.dump(exportData);

      case 'csv':
        return this.exportToCSV(exportData);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(exportData: TemplateExport): string {
    const headers = [
      'Template ID',
      'Template Name',
      'Milestone',
      'Custom Variables',
      'Custom Instructions',
      'Enabled',
      'Updated At',
    ];

    const rows = exportData.customizations.map((c) => [
      c.template_id,
      c.template_name,
      c.milestone,
      JSON.stringify(c.custom_variables),
      c.custom_instructions || '',
      c.enabled ? 'Yes' : 'No',
      c.updated_at,
    ]);

    const csvRows = [headers.join(','), ...rows.map((r) => r.join(','))];
    return csvRows.join('\n');
  }

  /**
   * Validate export data
   */
  validateExportData(data: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.version) {
      errors.push('Missing version field');
    }

    if (!data.customizations || !Array.isArray(data.customizations)) {
      errors.push('Missing or invalid customizations array');
      return { valid: false, errors };
    }

    for (const [index, customization] of data.customizations.entries()) {
      if (!customization.template_id) {
        errors.push(`Customization ${index}: missing template_id`);
      }
      if (!customization.milestone) {
        errors.push(`Customization ${index}: missing milestone`);
      }
      if (!customization.custom_variables) {
        errors.push(`Customization ${index}: missing custom_variables`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const templateExportService = new TemplateExportService();
