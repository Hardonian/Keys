import { createClient } from '@supabase/supabase-js';
import { codeRepoAdapter } from '../integrations/codeRepoAdapter.js';
import { processBackgroundEvent } from './eventProcessor.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExternalEvent {
  type: string;
  source: 'code_repo' | 'issue_tracker' | 'ci_cd' | 'infra' | 'metrics' | 'manual' | 'schedule';
  data: Record<string, any>;
  timestamp: Date;
}

export class BackgroundEventLoop {
  private isRunning = false;
  private pollInterval = 60000; // 1 minute
  private activeLoops: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start background event loop for a specific user
   */
  async start(userId: string) {
    if (this.activeLoops.has(userId)) {
      console.log(`Background event loop already running for user: ${userId}`);
      return;
    }

    console.log(`Starting background event loop for user: ${userId}`);

    const loop = async () => {
      try {
        await this.processEvents(userId);
      } catch (error) {
        console.error(`Background event loop error for user ${userId}:`, error);
      }
    };

    // Run immediately
    loop();

    // Then run on interval
    const intervalId = setInterval(loop, this.pollInterval);
    this.activeLoops.set(userId, intervalId);
  }

  /**
   * Stop background event loop for a specific user
   */
  stop(userId: string) {
    const intervalId = this.activeLoops.get(userId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeLoops.delete(userId);
      console.log(`Background event loop stopped for user: ${userId}`);
    }
  }

  /**
   * Stop all background event loops
   */
  stopAll() {
    for (const [userId, intervalId] of this.activeLoops) {
      clearInterval(intervalId);
      console.log(`Stopped background event loop for user: ${userId}`);
    }
    this.activeLoops.clear();
    this.isRunning = false;
  }

  /**
   * Start event loops for all active users
   */
  async startForAllUsers() {
    try {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id');

      if (profiles) {
        for (const profile of profiles) {
          await this.start(profile.user_id);
        }
      }
    } catch (error) {
      console.error('Error starting event loops for all users:', error);
    }
  }

  private async processEvents(userId: string) {
    // Poll external sources for events
    const events = await this.pollExternalEvents(userId);

    for (const event of events) {
      // Store event in background_events table
      const { data: eventRecord, error: saveError } = await supabase
        .from('background_events')
        .insert({
          user_id: userId,
          event_type: event.type,
          source: event.source,
          event_data: event.data,
          event_timestamp: event.timestamp.toISOString(),
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving background event:', saveError);
        continue;
      }

      // Determine if suggestion warranted
      const shouldSuggest = await this.shouldGenerateSuggestion(event, userId);

      if (shouldSuggest && eventRecord) {
        // Process event asynchronously (don't block the loop)
        processBackgroundEvent(userId, eventRecord).catch((error) => {
          console.error('Error processing background event:', error);
        });
      }
    }
  }

  private async pollExternalEvents(userId: string): Promise<ExternalEvent[]> {
    const events: ExternalEvent[] = [];

    // Poll code repo events (fallback polling if webhooks aren't configured)
    const codeRepoEvents = await this.pollCodeRepoEvents(userId);
    events.push(...codeRepoEvents);

      // Poll Supabase schema changes (if supabase adapter is configured)
      try {
        const supabaseEvents = await this.pollSupabaseEvents(userId);
        events.push(...supabaseEvents);
      } catch (error) {
        // Supabase adapter may not be configured, skip
        logger.debug('Supabase events polling skipped', { userId });
      }

    return events;
  }

  /**
   * Poll code repo for recent events (fallback if webhooks aren't configured)
   */
  private async pollCodeRepoEvents(userId: string): Promise<ExternalEvent[]> {
    const events: ExternalEvent[] = [];

    try {
      // Get user's last checked timestamp from database
      const { data: lastEvent } = await supabase
        .from('background_events')
        .select('event_timestamp')
        .eq('user_id', userId)
        .eq('source', 'code_repo')
        .order('event_timestamp', { ascending: false })
        .limit(1)
        .single();

      const lastChecked = lastEvent?.event_timestamp
        ? new Date(lastEvent.event_timestamp)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago

      // Get recent pull requests
      const recentPRs = await codeRepoAdapter.getRecentPullRequests(20, 'open');

      for (const pr of recentPRs) {
        const prCreated = new Date(pr.created_at);
        const prUpdated = new Date(pr.updated_at);

        // Check if PR was created recently
        if (prCreated > lastChecked) {
          events.push({
            type: 'repo.pr.opened',
            source: 'code_repo',
            data: {
              id: pr.id,
              number: pr.number,
              title: pr.title,
              author: pr.author,
              branch: pr.branch,
            },
            timestamp: prCreated,
          });
        }

        // Check if PR was updated recently (and not just created)
        if (prUpdated > lastChecked && prUpdated.getTime() !== prCreated.getTime()) {
          events.push({
            type: 'repo.pr.updated',
            source: 'code_repo',
            data: {
              id: pr.id,
              number: pr.number,
              title: pr.title,
            },
            timestamp: prUpdated,
          });
        }

        // Check if PR is stale
        const isStale = await codeRepoAdapter.isPRStale(pr.number, 7);
        if (isStale) {
          events.push({
            type: 'repo.pr.stale',
            source: 'code_repo',
            data: {
              id: pr.id,
              number: pr.number,
              title: pr.title,
            },
            timestamp: new Date(),
          });
        }

        // Check build status
        const buildStatus = await codeRepoAdapter.checkBuildStatus(pr.branch);
        if (buildStatus && buildStatus.status === 'failure') {
          events.push({
            type: 'repo.build.failed',
            source: 'ci_cd',
            data: {
              branch: pr.branch,
              commit: buildStatus.commit,
              workflow: buildStatus.workflow,
              logs_url: buildStatus.logs_url,
            },
            timestamp: buildStatus.completed_at ? new Date(buildStatus.completed_at) : new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error polling code repo events:', error);
    }

    return events;
  }

  /**
   * Poll Supabase for schema changes
   */
  private async pollSupabaseEvents(userId: string): Promise<ExternalEvent[]> {
    const events: ExternalEvent[] = [];

    try {
      // Import supabaseAdapter dynamically to avoid issues if not configured
      const { supabaseAdapter } = await import('../integrations/supabaseAdapter.js');
      
      // Detect schema changes
      const schemaChanges = await supabaseAdapter.detectSchemaChanges();

      for (const change of schemaChanges) {
        events.push({
          type: supabaseAdapter.schemaChangeToEventType(change),
          source: 'infra' as const, // Map supabase to infra source
          data: {
            change_type: change.type,
            table: change.table,
            column: change.column,
            details: change.details,
          },
          timestamp: change.timestamp,
        });
      }

      // Check for pending migrations
      const hasPendingMigrations = await supabaseAdapter.checkPendingMigrations();
      if (hasPendingMigrations) {
        events.push({
          type: 'supabase.migration.pending',
          source: 'infra' as const,
          data: {
            message: 'There are pending migrations to apply',
          },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.debug('Supabase events polling skipped', { userId });
    }

    return events;
  }

  private async shouldGenerateSuggestion(
    event: ExternalEvent,
    userId: string
  ): Promise<boolean> {
    // Determine if this event warrants a suggestion
    // Example: pr.opened -> suggest review checklist, build.failed -> suggest fixes
    const suggestionWorthyEvents = [
      'repo.pr.opened',
      'repo.pr.stale',
      'repo.build.failed',
      'issue.created',
      'issue.stale',
      'metric.regression',
      'incident.opened',
      'supabase.schema.changed',
    ];

    if (suggestionWorthyEvents.includes(event.type)) {
      return true;
    }

    // Check user preferences
    const { data: vibeConfig } = await supabase
      .from('vibe_configs')
      .select('auto_suggest')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return vibeConfig?.auto_suggest ?? true;
  }


  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const backgroundEventLoop = new BackgroundEventLoop();
