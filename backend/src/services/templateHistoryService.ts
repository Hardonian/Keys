/**
 * Template History Service
 * 
 * Manages template customization history and rollback functionality
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CustomizationHistoryEntry {
  id: string;
  customization_id: string;
  user_id: string;
  template_id: string;
  custom_variables: Record<string, any>;
  custom_instructions?: string;
  enabled: boolean;
  change_type: 'created' | 'updated' | 'deleted';
  change_reason?: string;
  created_at: string;
  changed_by: string;
}

export class TemplateHistoryService {
  /**
   * Get history for a customization
   */
  async getCustomizationHistory(
    userId: string,
    templateId: string
  ): Promise<CustomizationHistoryEntry[]> {
    // First get the customization ID
    const { data: customization } = await supabase
      .from('user_template_customizations')
      .select('id')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .single();

    if (!customization) {
      return [];
    }

    const { data, error } = await supabase
      .from('template_customization_history')
      .select('*')
      .eq('customization_id', customization.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get customization history', error);
      throw new Error(`Failed to get history: ${error.message}`);
    }

    return (data || []) as CustomizationHistoryEntry[];
  }

  /**
   * Rollback to a specific history entry
   */
  async rollbackToHistoryEntry(
    userId: string,
    templateId: string,
    historyEntryId: string
  ): Promise<void> {
    // Get the history entry
    const { data: historyEntry, error: historyError } = await supabase
      .from('template_customization_history')
      .select('*')
      .eq('id', historyEntryId)
      .eq('user_id', userId)
      .single();

    if (historyError || !historyEntry) {
      throw new Error('History entry not found');
    }

    // Get the customization
    const { data: customization, error: customizationError } = await supabase
      .from('user_template_customizations')
      .select('id')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .single();

    if (customizationError && customizationError.code !== 'PGRST116') {
      throw new Error(`Failed to get customization: ${customizationError.message}`);
    }

    // Update or create customization with history entry data
    const updateData = {
      user_id: userId,
      template_id: templateId,
      milestone: historyEntry.milestone || '',
      custom_variables: historyEntry.custom_variables,
      custom_instructions: historyEntry.custom_instructions,
      enabled: historyEntry.enabled,
      updated_at: new Date().toISOString(),
    };

    if (customization) {
      // Update existing
      const { error: updateError } = await supabase
        .from('user_template_customizations')
        .update(updateData)
        .eq('id', customization.id);

      if (updateError) {
        throw new Error(`Failed to rollback: ${updateError.message}`);
      }
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from('user_template_customizations')
        .insert(updateData);

      if (insertError) {
        throw new Error(`Failed to rollback: ${insertError.message}`);
      }
    }

    // Create history entry for rollback
    await supabase.from('template_customization_history').insert({
      customization_id: customization?.id || '',
      user_id: userId,
      template_id: templateId,
      custom_variables: historyEntry.custom_variables,
      custom_instructions: historyEntry.custom_instructions,
      enabled: historyEntry.enabled,
      change_type: 'updated',
      change_reason: `Rolled back to history entry ${historyEntryId}`,
      changed_by: userId,
    });
  }

  /**
   * Get version diff between two history entries
   */
  async getHistoryDiff(
    userId: string,
    templateId: string,
    entryId1: string,
    entryId2: string
  ): Promise<{
    entry1: CustomizationHistoryEntry;
    entry2: CustomizationHistoryEntry;
    diff: {
      variables: {
        added: Record<string, any>;
        removed: Record<string, any>;
        changed: Array<{
          key: string;
          oldValue: any;
          newValue: any;
        }>;
      };
      instructions: {
        changed: boolean;
        oldValue?: string;
        newValue?: string;
      };
      enabled: {
        changed: boolean;
        oldValue: boolean;
        newValue: boolean;
      };
    };
  }> {
    const { data: entries, error } = await supabase
      .from('template_customization_history')
      .select('*')
      .in('id', [entryId1, entryId2])
      .eq('user_id', userId)
      .eq('template_id', templateId);

    if (error || !entries || entries.length !== 2) {
      throw new Error('History entries not found');
    }

    const entry1 = entries.find((e) => e.id === entryId1)!;
    const entry2 = entries.find((e) => e.id === entryId2)!;

    // Calculate diff
    const vars1 = entry1.custom_variables || {};
    const vars2 = entry2.custom_variables || {};

    const added: Record<string, any> = {};
    const removed: Record<string, any> = {};
    const changed: Array<{ key: string; oldValue: any; newValue: any }> = [];

    // Find added and changed
    for (const [key, value] of Object.entries(vars2)) {
      if (!(key in vars1)) {
        added[key] = value;
      } else if (JSON.stringify(vars1[key]) !== JSON.stringify(value)) {
        changed.push({
          key,
          oldValue: vars1[key],
          newValue: value,
        });
      }
    }

    // Find removed
    for (const [key, value] of Object.entries(vars1)) {
      if (!(key in vars2)) {
        removed[key] = value;
      }
    }

    return {
      entry1: entry1 as CustomizationHistoryEntry,
      entry2: entry2 as CustomizationHistoryEntry,
      diff: {
        variables: {
          added,
          removed,
          changed,
        },
        instructions: {
          changed: entry1.custom_instructions !== entry2.custom_instructions,
          oldValue: entry1.custom_instructions,
          newValue: entry2.custom_instructions,
        },
        enabled: {
          changed: entry1.enabled !== entry2.enabled,
          oldValue: entry1.enabled,
          newValue: entry2.enabled,
        },
      },
    };
  }
}

export const templateHistoryService = new TemplateHistoryService();
