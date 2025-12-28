import { createClient } from '@supabase/supabase-js';
import { assemblePrompt } from './promptAssembly.js';
import { orchestrateAgent } from './agentOrchestration.js';
import { notificationService } from './notificationService.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Process a background event and generate suggestions if warranted
 */
export async function processBackgroundEvent(
  userId: string,
  eventRecord: any
): Promise<void> {
  try {
    // Check if suggestion should be generated
    const shouldSuggest = await shouldGenerateSuggestion(eventRecord, userId);

    if (!shouldSuggest) {
      return;
    }

    // Get user's vibe config
    const { data: vibeConfig } = await supabase
      .from('vibe_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!vibeConfig) {
      console.log(`No vibe config found for user ${userId}`);
      return;
    }

    // Generate task description based on event
    const taskDescription = eventToTaskDescription(eventRecord);

    // Assemble prompt
    const promptAssembly = await assemblePrompt(userId, taskDescription, vibeConfig);

    // Orchestrate agent
    const output = await orchestrateAgent(
      promptAssembly,
      taskDescription,
      taskDescription
    );

    // Log agent run
    const { data: run } = await supabase
      .from('agent_runs')
      .insert({
        user_id: userId,
        trigger: 'event',
        trigger_data: eventRecord.event_data,
        assembled_prompt: promptAssembly.systemPrompt,
        selected_atoms: promptAssembly.selectedAtomIds,
        vibe_config_snapshot: vibeConfig,
        agent_type: 'suggestion',
        model_used: output.modelUsed,
        generated_content: output.content,
        tokens_used: output.tokensUsed,
        cost_usd: output.costUsd,
      })
      .select()
      .single();

    // Update event with suggestion
    if (run) {
      await supabase
        .from('background_events')
        .update({
          suggestion_generated: true,
          suggestion_id: run.id,
        })
        .eq('id', eventRecord.id);

      // Notify user
      await notifyUserOfSuggestion(userId, run);
    }
  } catch (error) {
    console.error('Error processing background event:', error);
  }
}

async function shouldGenerateSuggestion(eventRecord: any, userId: string): Promise<boolean> {
  // Check user preferences
  const { data: vibeConfig } = await supabase
    .from('vibe_configs')
    .select('auto_suggest')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!vibeConfig?.auto_suggest) {
    return false;
  }

  // Check if event type warrants a suggestion
  const eventType = eventRecord.event_type;

  const suggestionWorthyEvents = [
    'shopify.product.created',
    'shopify.product.updated',
    'shopify.collection.created',
    'shopify.inventory.low',
    'shopify.order.created',
    'supabase.schema.changed',
    'supabase.table.created',
    'supabase.column.added',
  ];

  return suggestionWorthyEvents.some((type) => eventType.includes(type));
}

function eventToTaskDescription(eventRecord: any): string {
  const eventType = eventRecord.event_type;
  const eventData = eventRecord.event_data || {};

  switch (true) {
    case eventType.includes('shopify.product.created'):
      return `A new product "${eventData.title || 'product'}" was created in Shopify. Generate a TikTok hook and brief for promoting this product.`;

    case eventType.includes('shopify.product.updated'):
      return `Product "${eventData.title || 'product'}" was updated in Shopify. Suggest updated marketing copy and promotional content.`;

    case eventType.includes('shopify.collection.created'):
      return `A new collection was created in Shopify. Generate marketing content and promotional strategies for this collection.`;

    case eventType.includes('shopify.inventory.low'):
      return `Product inventory is running low. Suggest restocking strategies, customer communication, and promotional tactics.`;

    case eventType.includes('shopify.order.created'):
      return `A new order was placed. Suggest follow-up marketing and customer engagement strategies.`;

    case eventType.includes('supabase.schema.changed'):
    case eventType.includes('supabase.table.created'):
    case eventType.includes('supabase.column.added'):
      return `Database schema was changed. Generate documentation and migration notes for the changes.`;

    default:
      return `Event ${eventType} occurred. Suggest next steps and actions based on this event.`;
  }
}

async function notifyUserOfSuggestion(userId: string, run: any) {
  try {
    await notificationService.notifySuggestion(
      userId,
      run.id,
      run.trigger_data?.event_type || 'unknown',
      run.generated_content || ''
    );
  } catch (error) {
    console.error('Error notifying user of suggestion:', error);
  }
}
