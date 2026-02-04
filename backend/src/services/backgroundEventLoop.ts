import { createClient } from '@supabase/supabase-js';
import { codeRepoAdapter } from '../integrations/codeRepoAdapter.js';
import { isSuggestionWorthyEventType, processBackgroundEvent } from './eventProcessor.js';
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
  private pollBackoff: Map<
    string,
    {
      code_repo: { failures: number; nextAllowedAt: number };
      supabase: { failures: number; nextAllowedAt: number };
    }
  > = new Map();
  private readonly baseBackoffMs = 5000;
  private readonly maxBackoffMs = 300000;
  private readonly prConcurrency = (() => {
    const raw = process.env.CODE_REPO_POLL_CONCURRENCY;
    if (!raw) return 4;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return 4;
    return Math.max(1, Math.min(10, parsed));
  })();

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

      if (eventRecord && isSuggestionWorthyEventType(event.type)) {
        // Process event asynchronously (don't block the loop)
        processBackgroundEvent(userId, eventRecord).catch((error) => {
          console.error('Error processing background event:', error);
        });
      }
    }
  }

  private async pollExternalEvents(userId: string): Promise<ExternalEvent[]> {
    const events: ExternalEvent[] = [];
    const now = Date.now();
    const tasks: Array<Promise<ExternalEvent[]>> = [];

    // Poll code repo events (fallback polling if webhooks aren't configured)
    if (this.canPoll(userId, 'code_repo', now)) {
      tasks.push(this.runPollWithBackoff(userId, 'code_repo', () => this.pollCodeRepoEvents(userId)));
    } else {
      logger.debug('Code repo polling skipped due to backoff', { userId });
    }

    // Poll Supabase schema changes (if supabase adapter is configured)
    if (this.canPoll(userId, 'supabase', now)) {
      tasks.push(this.runPollWithBackoff(userId, 'supabase', () => this.pollSupabaseEvents(userId)));
    } else {
      logger.debug('Supabase events polling skipped due to backoff', { userId });
    }

    const results = await Promise.allSettled(tasks);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        events.push(...result.value);
      }
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

      const prEvents = await this.mapWithConcurrency(
        recentPRs,
        this.prConcurrency,
        async (pr) => {
          const eventsForPr: ExternalEvent[] = [];
          const prCreated = new Date(pr.created_at);
          const prUpdated = new Date(pr.updated_at);

          // Check if PR was created recently
          if (prCreated > lastChecked) {
            eventsForPr.push({
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
            eventsForPr.push({
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

          const [isStale, buildStatus] = await Promise.all([
            codeRepoAdapter.isPRStale(pr.number, 7),
            codeRepoAdapter.checkBuildStatus(pr.branch),
          ]);

          // Check if PR is stale
          if (isStale) {
            eventsForPr.push({
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
          if (buildStatus && buildStatus.status === 'failure') {
            eventsForPr.push({
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

          return eventsForPr;
        }
      );

      for (const batch of prEvents) {
        events.push(...batch);
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
    } catch (error: any) {
      const message = error?.message || '';
      if (message.includes('Cannot find module') || message.includes('supabaseAdapter')) {
        logger.debug('Supabase events polling skipped', { userId });
        return events;
      }
      throw error;
    }

    return events;
  }

  private canPoll(
    userId: string,
    source: 'code_repo' | 'supabase',
    now: number
  ): boolean {
    const state = this.getBackoffState(userId);
    return now >= state[source].nextAllowedAt;
  }

  private async runPollWithBackoff(
    userId: string,
    source: 'code_repo' | 'supabase',
    poller: () => Promise<ExternalEvent[]>
  ): Promise<ExternalEvent[]> {
    try {
      const events = await poller();
      this.resetBackoff(userId, source);
      return events;
    } catch (error) {
      this.applyBackoff(userId, source);
      logger.warn('Polling failed; applying backoff', {
        userId,
        source,
        nextAllowedAt: this.getBackoffState(userId)[source].nextAllowedAt,
      });
      return [];
    }
  }

  private getBackoffState(userId: string) {
    const existing = this.pollBackoff.get(userId);
    if (existing) {
      return existing;
    }

    const initial = {
      code_repo: { failures: 0, nextAllowedAt: 0 },
      supabase: { failures: 0, nextAllowedAt: 0 },
    };
    this.pollBackoff.set(userId, initial);
    return initial;
  }

  private resetBackoff(userId: string, source: 'code_repo' | 'supabase') {
    const state = this.getBackoffState(userId);
    state[source] = { failures: 0, nextAllowedAt: 0 };
  }

  private applyBackoff(userId: string, source: 'code_repo' | 'supabase') {
    const state = this.getBackoffState(userId);
    const failures = state[source].failures + 1;
    const backoffMs = Math.min(
      this.maxBackoffMs,
      this.baseBackoffMs * Math.pow(2, failures - 1)
    );
    state[source] = { failures, nextAllowedAt: Date.now() + backoffMs };
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    let index = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const current = index;
        index += 1;
        results[current] = await mapper(items[current]);
      }
    });

    await Promise.all(workers);
    return results;
  }
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const backgroundEventLoop = new BackgroundEventLoop();
