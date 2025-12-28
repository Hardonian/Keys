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
    'repo.pr.opened',
    'repo.pr.merged',
    'repo.pr.stale',
    'repo.build.failed',
    'repo.dependency.outdated',
    'issue.created',
    'issue.stale',
    'metric.regression',
    'incident.opened',
    'doc.outdated',
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
    case eventType.includes('repo.pr.opened'):
      return `A new pull request #${eventData.number || 'N/A'} "${eventData.title || 'PR'}" was opened. Generate a review checklist, suggest test coverage, and identify potential issues.`;

    case eventType.includes('repo.pr.stale'):
      return `Pull request #${eventData.number || 'N/A'} "${eventData.title || 'PR'}" has been stale for over a week. Suggest either closing it, splitting it into smaller PRs, or refreshing the specification.`;

    case eventType.includes('repo.build.failed'):
      return `Build failed for branch "${eventData.branch || 'unknown'}". Analyze the failure, suggest fixes, and propose code changes if needed.`;

    case eventType.includes('repo.dependency.outdated'):
      return `Dependencies are outdated. Suggest an update plan, check for breaking changes, and propose a migration strategy.`;

    case eventType.includes('issue.created'):
      return `A new issue was created: "${eventData.title || 'issue'}". Suggest a solution approach, break it down into tasks, or propose an RFC if it's a significant change.`;

    case eventType.includes('issue.stale'):
      return `Issue "${eventData.title || 'issue'}" has been stale. Suggest either closing it, updating the spec, or breaking it into smaller issues.`;

    case eventType.includes('metric.regression'):
      return `A metric regression was detected: ${eventData.metric || 'unknown'}. Analyze the cause, review recent changes, and propose remediation steps.`;

    case eventType.includes('incident.opened'):
      return `An incident was opened: "${eventData.title || 'incident'}". Suggest an investigation plan, propose fixes, and draft a postmortem template.`;

    case eventType.includes('doc.outdated'):
      return `Documentation appears outdated. Review the codebase, identify gaps, and suggest documentation updates.`;

    case eventType.includes('supabase.schema.changed'):
    case eventType.includes('supabase.table.created'):
    case eventType.includes('supabase.column.added'):
      return `Database schema was changed. Generate documentation, migration notes, and update API documentation for the changes.`;

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
