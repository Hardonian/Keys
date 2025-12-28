# Background Event Loop Service - Implementation Summary

## Overview

The background event loop service monitors code repositories, CI/CD systems, issue trackers, and metrics to generate proactive suggestions for users based on events in their development workflow.

## Components Created

### 1. Integration Adapters

#### `backend/src/integrations/codeRepoAdapter.ts`
- **CodeRepoAdapter class** with methods:
  - `verifyWebhookSignature()` - Verifies webhook signatures (GitHub, GitLab, Bitbucket)
  - `parseWebhook()` - Parses and validates webhook payloads
  - `fetchPullRequest()` - Fetches PR details from repository APIs
  - `checkBuildStatus()` - Checks CI/CD build status for branches/commits
  - `getRecentPullRequests()` - Polls for recent PRs (fallback)
  - `isPRStale()` - Checks if PR has been inactive
  - `eventToEventType()` - Maps webhook events to internal event types

#### `backend/src/integrations/contentAdapter.ts`
- **ContentAdapter class** for generating communication artifacts:
  - `generateReleaseNotes()` - Creates release notes from changelog data
  - `generateChangelogEntry()` - Generates changelog entries
  - `generateRFC()` - Creates RFC (Request for Comments) structure
  - `generateADR()` - Creates ADR (Architecture Decision Record)
  - `formatAsMarkdown()` / `formatAsPlainText()` - Format content artifacts

#### `backend/src/integrations/supabaseAdapter.ts`
- **SupabaseAdapter class** with methods:
  - `detectSchemaChanges()` - Monitors schema changes by comparing snapshots
  - `getCurrentSchema()` - Retrieves current database schema
  - `checkPendingMigrations()` - Checks for pending migrations
  - `schemaChangeToEventType()` - Converts schema changes to event types

### 2. Background Event Loop Service

#### `backend/src/services/backgroundEventLoop.ts`
- **BackgroundEventLoop class** with:
  - `start(userId)` - Starts event loop for a user
  - `stop(userId)` - Stops event loop for a user
  - `startForAllUsers()` - Starts loops for all active users
  - `pollCodeRepoEvents()` - Polls code repos for new events (PRs, builds, issues)
  - `pollSupabaseEvents()` - Polls Supabase for schema changes
  - Supports multiple concurrent user loops

### 3. Event Processor

#### `backend/src/services/eventProcessor.ts`
- **processBackgroundEvent()** - Main processing function
- Determines if events warrant suggestions
- Generates proactive suggestions using prompt assembly
- Logs agent runs and updates events
- Handles notifications

### 4. Webhook Routes

#### `backend/src/routes/webhooks.ts`
- **POST /webhooks/code-repo** - Receives code repository webhooks (GitHub/GitLab/Bitbucket)
  - Verifies webhook signature
  - Maps events to internal event types
  - Stores events and triggers processing
  
- **POST /webhooks/supabase** - Receives Supabase webhooks
  - Processes database change events
  - Extracts user context
  - Stores and processes events

## Event Flow

```
1. External Event Occurs
   ├─ Code Repo: PR opened, build failed, issue created
   ├─ CI/CD: Build completed, workflow failed
   ├─ Issue Tracker: Issue created, stale issue detected
   └─ Metrics: Regression detected, anomaly found

2. Event Received
   ├─ Via Webhook (real-time)
   └─ Via Polling (fallback, every 60 seconds)

3. Event Stored
   └─ Saved to background_events table

4. Decision: Should Generate Suggestion?
   ├─ Check user's auto_suggest preference
   └─ Check if event type warrants suggestion

5. Generate Suggestion (if warranted)
   ├─ Assemble prompt using user profile + vibe config
   ├─ Orchestrate agent to generate content
   ├─ Log agent run
   └─ Update event with suggestion_id

6. Notify User
   └─ (Future: WebSocket, email, Slack, UI toast)
```

## Supported Event Types

### Code Repository Events
- `repo.pr.opened` → Generate review checklist, suggest test coverage
- `repo.pr.merged` → Suggest documentation updates, changelog entry
- `repo.pr.stale` → Suggest closing, splitting, or refreshing spec
- `repo.build.failed` → Analyze failure, suggest fixes, propose code changes
- `repo.dependency.outdated` → Suggest update plan, migration strategy
- `repo.push` → Check for breaking changes, suggest tests

### Issue Tracker Events
- `issue.created` → Suggest solution approach, break down into tasks, propose RFC
- `issue.stale` → Suggest closing, updating spec, or breaking into smaller issues
- `issue.comment.created` → Analyze discussion, suggest next steps

### CI/CD Events
- `repo.build.failed` → Analyze logs, suggest fixes, propose code changes
- `repo.build.completed` → Review build health, suggest optimizations

### Metrics Events
- `metric.regression` → Analyze cause, review recent changes, propose remediation
- `incident.opened` → Suggest investigation plan, propose fixes, draft postmortem

### Supabase Events
- `supabase.schema.changed` → Generate documentation
- `supabase.table.created` → Document new table
- `supabase.column.added` → Document schema changes
- `supabase.migration.pending` → Alert about pending migrations

## Configuration

### Environment Variables Required
```env
CODE_REPO_API_KEY=your_api_key (or GITHUB_TOKEN)
CODE_REPO_WEBHOOK_SECRET=your_webhook_secret (or GITHUB_WEBHOOK_SECRET)
CODE_REPO_URL=your-org/your-repo (or GITHUB_REPO_URL)
CODE_REPO_PROVIDER=github (or gitlab, bitbucket)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Code Repository Webhook Setup

#### GitHub
1. Go to Repository → Settings → Webhooks
2. Create webhook: `POST https://your-domain.com/webhooks/code-repo`
3. Select events:
   - Pull requests
   - Pull request reviews
   - Issues
   - Workflow runs
   - Check runs

#### GitLab
1. Go to Project → Settings → Webhooks
2. Create webhook: `POST https://your-domain.com/webhooks/code-repo`
3. Select events:
   - Merge request events
   - Pipeline events
   - Issue events

### Starting the Service

```typescript
import { backgroundEventLoop } from './services/backgroundEventLoop';

// Start for specific user
await backgroundEventLoop.start('user-id');

// Start for all users
await backgroundEventLoop.startForAllUsers();
```

## Database Schema

Events are stored in `background_events` table:
- `id` - UUID
- `user_id` - User identifier
- `event_type` - Type of event (e.g., "repo.pr.opened", "repo.build.failed")
- `source` - Source system ("code_repo", "issue_tracker", "ci_cd", "infra", "metrics", "manual", "schedule")
- `event_data` - Full event payload (JSONB)
- `event_timestamp` - When event occurred
- `suggestion_generated` - Boolean flag
- `suggestion_id` - Reference to agent_runs table
- `user_actioned` - Whether user acted on suggestion

## Example Event Processing

### Example 1: `repo.build.failed`
1. Detect failing builds via webhook or polling
2. Fetch build logs and PR details
3. Summarize failure cause
4. Propose fixes (code changes, config updates)
5. Offer to open PR or patch file directly

### Example 2: `metric.regression`
1. Detect metric regression (error rate, latency increase)
2. Agent reads logs, recent commits, related issues
3. Proposes analysis + remediation plan
4. Optionally generates code fixes

### Example 3: `issue.stale`
1. Detect old issues with no activity
2. Agent proposes either:
   - Closing if resolved/obsolete
   - Splitting into smaller issues
   - Refreshing specification

## Future Enhancements

1. **Real-time Notifications**
   - WebSocket/SSE for UI updates
   - Email notifications
   - Slack integration
   - Push notifications

2. **Advanced Filtering**
   - User-defined event filters
   - Event importance scoring
   - Rate limiting per event type

3. **Schedule Integration**
   - Monitor calendar events
   - Weekly review reminders
   - Sprint planning suggestions

4. **Performance Optimization**
   - Event batching
   - Parallel processing
   - Caching strategies

5. **Monitoring & Analytics**
   - Event processing metrics
   - Suggestion acceptance rates
   - Error tracking and alerting

6. **Additional Integrations**
   - Jira, Linear for issue tracking
   - Notion, Confluence for documentation
   - PostHog, Datadog for metrics
   - AWS CloudWatch, GCP Monitoring
