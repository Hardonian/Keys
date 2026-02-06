import type { Request, Response } from 'express';
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { codeRepoAdapter } from '../integrations/codeRepoAdapter.js';
import { logger } from '../utils/logger.js';
import { getLatestVibeConfig } from '../services/vibeConfig.js';
import {
  WebhookSecurityManager,
  webhookSecurityManager,
} from '../utils/security/webhookSecurity.js';

const router = Router() as Router;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    full_name: string;
    name: string;
    owner?: {
      login: string;
    };
  };
  pull_request?: {
    number: number;
    title: string;
    head?: {
      ref: string;
    };
    base?: {
      ref: string;
    };
  };
  sender?: {
    login: string;
  };
  issue?: {
    number: number;
    title: string;
  };
  delivery_id?: string;
}

router.post('/code-repo', async (req: Request, res: Response) => {
  const webhookStart = Date.now();

  try {
    const headers = req.headers as Record<string, string>;
    const rawBody = req.body instanceof Buffer
      ? req.body.toString('utf8')
      : JSON.stringify(req.body);

    const bodyData: GitHubWebhookPayload = req.body instanceof Buffer
      ? JSON.parse(rawBody)
      : req.body;

    const signature = headers['x-hub-signature-256'] ||
                      headers['X-Hub-Signature-256'] ||
                      headers['x-hub-signature'] ||
                      headers['X-Hub-Signature'];

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ||
                         process.env.CODE_REPO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('Webhook secret not configured', undefined, {
        source: 'github',
      });
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (signature) {
      const isValid = webhookSecurityManager.verifyGitHubSignature(
        rawBody,
        signature,
        webhookSecret
      );

      if (!isValid) {
        logger.warn('Invalid webhook signature', {
          source: 'github',
          deliveryId: headers['x-github-delivery'],
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      logger.warn('No signature provided', {
        source: 'github',
      });
      return res.status(401).json({ error: 'Signature required' });
    }

    const event = headers['x-github-event'] || headers['X-GitHub-Event'] || '';
    const deliveryId = webhookSecurityManager.extractGitHubDeliveryId(headers);

    if (!deliveryId) {
      logger.warn('No delivery ID in GitHub webhook', {
        eventType: event,
        hasHeaders: Object.keys(headers).some(k => k.toLowerCase().includes('github')),
      });
      return res.status(400).json({ error: 'Missing delivery ID' });
    }

    const { valid: replayValid, reason } = webhookSecurityManager.validateReplayProtection();

    if (!replayValid) {
      logger.warn('Replay attack detected', {
        deliveryId,
        reason,
      });
      return res.status(400).json({ error: 'Stale event' });
    }

    const { success, isDuplicate, record } = await webhookSecurityManager.recordProcessing(
      deliveryId,
      'github',
      event
    );

    if (isDuplicate && record) {
      logger.info('Duplicate webhook delivery', {
        deliveryId,
        eventType: event,
        originalStatus: record.status,
        latencyMs: Date.now() - webhookStart,
      });

      if (record.status === 'processed') {
        return res.status(200).json({
          received: true,
          duplicate: true,
          originalEventId: record.id,
        });
      } else if (record.status === 'processing') {
        return res.status(200).json({
          received: true,
          duplicate: true,
          processing: true,
        });
      }
    }

    if (!success) {
      logger.warn('Failed to record webhook processing', {
        deliveryId,
        eventType: event,
      });
      return res.status(500).json({ error: 'Failed to process webhook' });
    }

    const action = bodyData.action;
    const eventType = codeRepoAdapter.eventToEventType(event, action);

    const webhookData = {
      deliveryId,
      event,
      eventType,
      repository: bodyData.repository?.full_name,
      action,
      pullRequest: bodyData.pull_request ? {
        number: bodyData.pull_request.number,
        title: bodyData.pull_request.title,
        branch: bodyData.pull_request.head?.ref,
        baseBranch: bodyData.pull_request.base?.ref,
      } : null,
      issue: bodyData.issue ? {
        number: bodyData.issue.number,
        title: bodyData.issue.title,
      } : null,
      sender: bodyData.sender?.login,
      timestamp: new Date().toISOString(),
    };

    const userId = await getUserIdFromRepo(webhookData.repository);

    if (!userId) {
      logger.warn('No user found for repository', {
        repository: webhookData.repository,
        eventType,
        deliveryId,
      });

      await webhookSecurityManager.markProcessed(deliveryId, {
        reason: 'No user found',
        repository: webhookData.repository,
      });

      return res.status(200).json({ received: true, eventId: deliveryId });
    }

    let source: 'code_repo' | 'ci_cd' | 'issue_tracker' = 'code_repo';
    if (eventType.includes('build') || eventType.includes('workflow') || event.includes('workflow')) {
      source = 'ci_cd';
    } else if (eventType.includes('issue') || event.includes('issues')) {
      source = 'issue_tracker';
    }

    const { data: eventRecord, error: saveError } = await supabase
      .from('background_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        source,
        event_data: webhookData,
        event_timestamp: webhookData.timestamp,
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving code repo webhook event', {
        userId,
        eventType,
        repository: webhookData.repository,
        deliveryId,
        error: saveError instanceof Error ? saveError.message : String(saveError),
      });

      await webhookSecurityManager.markFailed(deliveryId, saveError.message);

      return res.status(500).json({ error: 'Failed to save event' });
    }

    processWebhookEvent(userId, eventRecord, deliveryId).catch((error) => {
      logger.error('Error processing webhook event', error as Error, {
        userId,
        eventId: eventRecord.id,
        eventType,
        deliveryId,
      });
    });

    await webhookSecurityManager.markProcessed(deliveryId, {
      backgroundEventId: eventRecord.id,
      userId,
    });

    logger.info('Code repo webhook processed', {
      deliveryId,
      eventType,
      repository: webhookData.repository,
      latencyMs: Date.now() - webhookStart,
    });

    res.status(200).json({ received: true, eventId: deliveryId });
  } catch (error) {
    logger.error('Error processing code repo webhook', error as Error, {
      repository: (req.body as any)?.repository,
    });

    const deliveryId = webhookSecurityManager.extractGitHubDeliveryId(
      req.headers as Record<string, string>
    );
    if (deliveryId) {
      await webhookSecurityManager.markFailed(
        deliveryId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/supabase', async (req: Request, res: Response) => {
  const webhookStart = Date.now();

  try {
    const headers = req.headers as Record<string, string>;
    const { event_type, table, record, old_record, id } = req.body;

    const signature = headers['x-supabase-signature'] ||
                      headers['X-Supabase-Signature'];

    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const rawBody = JSON.stringify(req.body);
      const isValid = webhookSecurityManager.verifySupabaseWebhook(
        rawBody,
        signature,
        webhookSecret
      );

      if (!isValid) {
        logger.warn('Invalid Supabase webhook signature', {
          table,
          eventType: event_type,
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const webhookId = id || req.body.uid || `supabase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { valid: replayValid, reason } = webhookSecurityManager.validateReplayProtection();

    if (!replayValid) {
      logger.warn('Replay attack detected', {
        webhookId,
        reason,
      });
      return res.status(400).json({ error: 'Stale event' });
    }

    const { success, isDuplicate, record: existingRecord } = await webhookSecurityManager.recordProcessing(
      webhookId,
      'supabase',
      `supabase.${table}.${event_type}`
    );

    if (isDuplicate && existingRecord) {
      logger.info('Duplicate Supabase webhook', {
        webhookId,
        eventType: `supabase.${table}.${event_type}`,
        latencyMs: Date.now() - webhookStart,
      });

      return res.status(200).json({
        received: true,
        duplicate: true,
        eventId: webhookId,
      });
    }

    if (!success) {
      logger.error('Failed to record Supabase webhook', { webhookId });
      return res.status(500).json({ error: 'Failed to process webhook' });
    }

    const userId = extractUserIdFromRecord(record, table);

    if (!userId) {
      logger.warn('No user found for Supabase record', {
        webhookId,
        table,
        eventType: event_type,
      });

      await webhookSecurityManager.markProcessed(webhookId, {
        reason: 'No user found',
        table,
      });

      return res.status(200).json({ received: true, eventId: webhookId });
    }

    const eventType = `supabase.${table}.${event_type}`;

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
          webhookId,
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
        webhookId,
      });

      await webhookSecurityManager.markFailed(webhookId, saveError.message);

      return res.status(500).json({ error: 'Failed to save event' });
    }

    await webhookSecurityManager.markProcessed(webhookId, {
      backgroundEventId: eventRecord.id,
      userId,
    });

    logger.info('Supabase webhook processed', {
      webhookId,
      eventType,
      table,
      latencyMs: Date.now() - webhookStart,
    });

    res.status(200).json({ received: true, eventId: webhookId });
  } catch (error) {
    logger.error('Error processing Supabase webhook', error as Error, {
      table: (req.body as any)?.table,
      eventType: (req.body as any)?.event_type,
    });

    const webhookId = (req.body as any)?.id || (req.body as any)?.uid;
    if (webhookId) {
      await webhookSecurityManager.markFailed(
        webhookId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getUserIdFromRepo(repository: string): Promise<string | null> {
  if (!repository) return null;

  try {
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

function extractUserIdFromRecord(record: any, table: string): string | null {
  if (!record) return null;

  if (record?.user_id) return record.user_id;
  if (record?.userId) return record.userId;
  if (record?.owner_id) return record.owner_id;
  if (record?.ownerId) return record.ownerId;
  if (record?.created_by) return record.created_by;

  if (table === 'user_profiles' && record?.user_id) {
    return record.user_id;
  }

  return null;
}

async function processWebhookEvent(
  userId: string,
  eventRecord: any,
  webhookDeliveryId: string
) {
  try {
    const { assemblePrompt } = await import('../services/promptAssembly.js');
    const { orchestrateAgent } = await import('../services/agentOrchestration.js');

    const fullVibeConfig = await getLatestVibeConfig(userId);
    if (!fullVibeConfig) {
      return;
    }

    if (!fullVibeConfig.auto_suggest) {
      return;
    }

    const taskDescription = eventToTaskDescription(eventRecord);

    const promptAssembly = await assemblePrompt(userId, taskDescription, fullVibeConfig);

    const output = await orchestrateAgent(
      promptAssembly,
      taskDescription,
      taskDescription
    );

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

    if (run) {
      await supabase
        .from('background_events')
        .update({
          suggestion_generated: true,
          suggestion_id: run.id,
        })
        .eq('id', eventRecord.id);
    }

    logger.info('Webhook event processed successfully', {
      userId,
      eventId: eventRecord.id,
      eventType: eventRecord.event_type,
      webhookDeliveryId,
      suggestionId: run?.id,
    });
  } catch (error) {
    logger.error('Error in background webhook processing', error as Error, {
      userId,
      eventId: eventRecord.id,
      webhookDeliveryId,
    });
  }
}

function eventToTaskDescription(eventRecord: any): string {
  const eventType = eventRecord.event_type;
  const eventData = eventRecord.event_data || {};

  if (eventType.startsWith('repo.pr.opened')) {
    return `A new pull request #${eventData.pullRequest?.number || 'N/A'} "${eventData.pullRequest?.title || 'PR'}" was opened. Generate a review checklist, suggest test coverage, and identify potential issues.`;
  }

  if (eventType.startsWith('repo.pr.stale')) {
    return `Pull request #${EventData?.pullRequest?.number || 'N/A'} "${eventData.pullRequest?.title || 'PR'}" has been stale. Suggest either closing it, splitting it into smaller PRs, or refreshing the specification.`;
  }

  if (eventType.startsWith('repo.build.failed')) {
    return `Build failed for branch "${eventData.pullRequest?.branch || 'unknown'}". Analyze the failure, suggest fixes, and propose code changes if needed.`;
  }

  if (eventType.startsWith('issue.created')) {
    return `A new issue was created: "${eventData.issue?.title || 'issue'}". Suggest a solution approach, break it down into tasks, or propose an RFC if it's a significant change.`;
  }

  if (eventType.startsWith('supabase.schema')) {
    return `Database schema was changed. Generate documentation and migration notes for the changes.`;
  }

  return `Event ${eventType} occurred. Suggest next steps and actions.`;
}

export { router as webhooksRouter };
