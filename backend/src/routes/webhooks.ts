import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { codeRepoAdapter } from '../integrations/codeRepoAdapter.js';
import { logger } from '../utils/logger.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Code repository webhook endpoint (GitHub, GitLab, Bitbucket)
 * POST /webhooks/code-repo
 * Note: This route should use express.raw() middleware for signature verification
 */
router.post('/code-repo', async (req, res) => {
  try {
    // Get raw body for signature verification
    // req.body will be a Buffer if express.raw() middleware is used
    const rawBody = req.body instanceof Buffer 
      ? req.body.toString('utf8') 
      : JSON.stringify(req.body);
    
    const headers = req.headers as Record<string, string>;
    
    // Parse body
    const bodyData = req.body instanceof Buffer 
      ? JSON.parse(rawBody) 
      : req.body;

    // Parse and verify webhook
    const webhook = codeRepoAdapter.parseWebhook(bodyData, headers);

    if (!webhook) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Convert webhook event to internal event type
    const action = bodyData.action || bodyData.object_attributes?.action;
    const eventType = codeRepoAdapter.eventToEventType(webhook.event, action);

    // Get user_id from repository or webhook data
    // In production, you'd have a mapping table: repository -> user_id
    const userId = await getUserIdFromRepo(webhook.repository);

    if (!userId) {
      logger.warn('No user found for repository', {
        repository: webhook.repository,
        eventType,
      });
      return res.status(200).json({ received: true }); // Return 200 to acknowledge webhook
    }

    // Determine source based on event type
    let source: 'code_repo' | 'ci_cd' | 'issue_tracker' = 'code_repo';
    if (eventType.includes('build') || eventType.includes('workflow')) {
      source = 'ci_cd';
    } else if (eventType.includes('issue')) {
      source = 'issue_tracker';
    }

    // Store event in background_events table
    const { data: eventRecord, error: saveError } = await supabase
      .from('background_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        source: source,
        event_data: webhook.data,
        event_timestamp: webhook.timestamp,
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving code repo webhook event', saveError as any, {
        userId,
        eventType,
        repository: webhook.repository,
      });
      return res.status(500).json({ error: 'Failed to save event' });
    }

    // Trigger background processing (async, don't wait)
    processWebhookEvent(userId, eventRecord).catch((error) => {
      logger.error('Error processing webhook event', error as Error, {
        userId,
        eventId: eventRecord.id,
        eventType,
      });
    });

    // Acknowledge webhook immediately
    res.status(200).json({ received: true, eventId: eventRecord.id });
  } catch (error) {
    logger.error('Error processing code repo webhook', error as Error, {
      repository: req.body?.repository,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Supabase webhook endpoint (for database changes via Supabase webhooks)
 * POST /webhooks/supabase
 */
router.post('/supabase', async (req, res) => {
  try {
    const { event_type, table, record, old_record } = req.body;

    // Get user_id from record or context
    // In production, you'd determine this from the record data
    const userId = extractUserIdFromRecord(record, table);

    if (!userId) {
      return res.status(200).json({ received: true });
    }

    const eventType = `supabase.${table}.${event_type}`;

    // Store event
    const { data: eventRecord, error: saveError } = await supabase
      .from('background_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        source: 'supabase',
        event_data: {
          table,
          record,
          old_record,
          event_type,
        },
        event_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving Supabase webhook event', saveError as any, {
        userId,
        eventType,
        table,
      });
      return res.status(500).json({ error: 'Failed to save event' });
    }

    // Trigger background processing
    processWebhookEvent(userId, eventRecord).catch((error) => {
      logger.error('Error processing webhook event', error as Error, {
        userId,
        eventId: eventRecord.id,
        eventType,
      });
    });

    res.status(200).json({ received: true, eventId: eventRecord.id });
  } catch (error) {
    logger.error('Error processing Supabase webhook', error as Error, {
      table: req.body?.table,
      eventType: req.body?.event_type,
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper: Get user_id from repository
 */
async function getUserIdFromRepo(repository: string): Promise<string | null> {
  // In production, you'd have a repo_users table mapping repositories to user_ids
  // For now, return null or implement a lookup
  try {
    // Example: Check if user has code_repo in their stack and use their user_id
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id')
      .contains('stack', { code_repo: true })
      .limit(1)
      .single();

    return data?.user_id || null;
  } catch {
    return null;
  }
}

/**
 * Helper: Extract user_id from Supabase record
 */
function extractUserIdFromRecord(record: any, table: string): string | null {
  // Try common user_id fields
  if (record?.user_id) return record.user_id;
  if (record?.userId) return record.userId;
  if (record?.owner_id) return record.owner_id;

  // For user_profiles table, use the user_id field
  if (table === 'user_profiles' && record?.user_id) {
    return record.user_id;
  }

  return null;
}

/**
 * Process webhook event asynchronously
 */
async function processWebhookEvent(userId: string, eventRecord: any) {
  try {
    // Check if suggestion should be generated
    const { data: vibeConfig } = await supabase
      .from('vibe_configs')
      .select('auto_suggest')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!vibeConfig?.auto_suggest) {
      return;
    }

    // Import here to avoid circular dependencies
    const { assemblePrompt } = await import('../services/promptAssembly.js');
    const { orchestrateAgent } = await import('../services/agentOrchestration.js');

    // Get full vibe config
    const { data: fullVibeConfig } = await supabase
      .from('vibe_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!fullVibeConfig) {
      return;
    }

    // Generate task description
    const taskDescription = eventToTaskDescription(eventRecord);

    // Assemble prompt
    const promptAssembly = await assemblePrompt(userId, taskDescription, fullVibeConfig);

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
        vibe_config_snapshot: fullVibeConfig,
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
    }
  } catch (error) {
    logger.error('Error processing webhook event', error as Error, {
      userId,
      eventId: eventRecord.id,
    });
  }
}

function eventToTaskDescription(eventRecord: any): string {
  const eventType = eventRecord.event_type;
  const eventData = eventRecord.event_data || {};

  if (eventType.startsWith('repo.pr.opened')) {
    return `A new pull request #${eventData.number || 'N/A'} "${eventData.title || 'PR'}" was opened. Generate a review checklist, suggest test coverage, and identify potential issues.`;
  }

  if (eventType.startsWith('repo.pr.stale')) {
    return `Pull request #${eventData.number || 'N/A'} "${eventData.title || 'PR'}" has been stale. Suggest either closing it, splitting it into smaller PRs, or refreshing the specification.`;
  }

  if (eventType.startsWith('repo.build.failed')) {
    return `Build failed for branch "${eventData.branch || 'unknown'}". Analyze the failure, suggest fixes, and propose code changes if needed.`;
  }

  if (eventType.startsWith('issue.created')) {
    return `A new issue was created: "${eventData.title || 'issue'}". Suggest a solution approach, break it down into tasks, or propose an RFC if it's a significant change.`;
  }

  if (eventType.startsWith('supabase.schema')) {
    return `Database schema was changed. Generate documentation and migration notes for the changes.`;
  }

  return `Event ${eventType} occurred. Suggest next steps and actions.`;
}

export { router as webhooksRouter };
