# Cursor Venture Companion Refactor Summary

## Overview

Successfully refactored the project from a Shopify/e-commerce focused platform to a **platform-agnostic "Cursor Venture Companion"** that supports the entire venture and project lifecycle.

## Main Changes

### 1. Global Renaming & Concept Reframe

#### Domain-Specific → Generic Concepts
- `Shopify`, `shopify`, `product`, `product.created` → `code_repo`, `project`, `feature`, `repo.pr.opened`
- "e-commerce store", "Shopify store" → "software product", "application", "service"
- "TikTok ads/briefs/hooks" → "communication artifacts" (RFCs, changelogs, announcements)
- `stack.shopify_2_0` → `stack.web_app`
- `capcut`, `tiktok_ads` → `contentAdapter` (release notes, changelogs, RFCs, ADRs)

#### Event Types
- `shopify.product.created` → `repo.pr.opened`
- `shopify.inventory.low` → `metric.regression`
- `shopify.order.created` → `incident.opened`
- Product-based triggers → Project/repo/issue/metric-based triggers

#### Vertical & Role Updates
- `vertical: 'ecommerce'` → `vertical: 'software'`, `'agency'`, `'internal_tools'`, `'content'`
- `role: 'operator' | 'marketer'` → `role: 'founder' | 'pm' | 'staff_engineer' | 'devops' | 'cfo' | 'investor'`

### 2. Data Model Generalization

#### SQL Migrations Updated
- **001_create_user_profiles.sql**: Updated roles, verticals, and stack defaults
- **002_create_prompt_atoms.sql**: Updated category comments
- **003_create_vibe_configs.sql**: Updated slider descriptions and comments
- **005_create_background_events.sql**: Updated event_type and source examples

#### TypeScript Types Updated
- **backend/src/types/index.ts**: All interfaces updated with new generic concepts
- **frontend/src/types/index.ts**: Matching frontend types updated

### 3. Integration Adapters Refactored

#### New Adapters Created
- **codeRepoAdapter.ts**: Generic adapter for GitHub/GitLab/Bitbucket
  - Webhook verification (GitHub, GitLab, Bitbucket)
  - PR fetching and management
  - Build status checking
  - Stale PR detection

- **contentAdapter.ts**: Generic content generation
  - Release notes
  - Changelogs
  - RFCs (Request for Comments)
  - ADRs (Architecture Decision Records)
  - Markdown/plain text formatting

#### Old Adapters
- `shopifyAdapter.ts` - Kept for reference (not imported)
- `capcutAdapter.ts` - Kept for reference (not imported)

### 4. Prompt Atoms Updated

#### New Atom Categories
- **Perspective Atoms**: `founder`, `pm`, `staff_engineer`, `devops`, `cfo`, `investor`
- **Phase/Lifecycle Atoms**: `ideation`, `specification`, `implementation`, `launch`, `operation`, `evolution`
- **Stack Atoms**: `web_app`, `microservices`, `data_pipeline`, `llm_product`
- **Domain Atoms**: `saas`, `internal_tools`, `content_platform`, `agency`
- **Goal Atoms**: `velocity`, `reliability`, `growth`, `revenue`, `quality`

#### Seed Data (`backend/supabase/seed.sql`)
- Completely rewritten with 30+ new atoms
- All examples updated to reflect venture lifecycle
- Removed all Shopify/e-commerce specific atoms

### 5. Background Event Loop Refactored

#### Event Types Updated
- `repo.pr.opened` → Generate review checklist, suggest test coverage
- `repo.pr.stale` → Suggest closing, splitting, or refreshing spec
- `repo.build.failed` → Analyze failure, suggest fixes
- `repo.dependency.outdated` → Suggest update plan
- `issue.created` → Suggest solution approach, propose RFC
- `issue.stale` → Suggest closing or updating
- `metric.regression` → Analyze cause, propose remediation
- `incident.opened` → Suggest investigation plan, draft postmortem

#### Services Updated
- **backgroundEventLoop.ts**: Now polls code repos instead of Shopify
- **eventProcessor.ts**: Event-to-task-description mapping updated
- **webhooks.ts**: Routes updated for code repository webhooks

### 6. Frontend Components Updated

#### UI Copy & Positioning
- **Chat page**: "Cursor Venture Companion" with venture lifecycle positioning
- **InputPanel**: Updated placeholder examples (RFCs, architecture, test plans)
- **ChatInterface**: Welcome message with example prompts
- **EventFeed**: Updated icons and colors for new event sources
- **StackSelector**: New stack options (code_repo, issue_tracker, doc_space, ci_cd, infra, analytics)
- **ProfileOnboarding**: Updated roles and project types

#### Slider Labels
- "Revenue Focus" → "Business Outcome Focus" (0 = Exploratory, 100 = ROI-obsessed)
- "Investor Perspective" description updated

### 7. Documentation Updated

#### README.md
- Complete rewrite positioning as "AI cofounder for the entire product lifecycle"
- Features: Ideation, Specification, Implementation, DevOps, Evolution
- Platform-agnostic positioning

#### BACKGROUND_EVENT_LOOP.md
- Complete rewrite with new event types
- Code repository webhook setup instructions
- Example event processing flows

## Files Modified

### Backend
- `backend/supabase/migrations/*.sql` (5 files)
- `backend/src/types/index.ts`
- `backend/src/integrations/codeRepoAdapter.ts` (new)
- `backend/src/integrations/contentAdapter.ts` (new)
- `backend/src/integrations/integrations.index.ts`
- `backend/src/services/backgroundEventLoop.ts`
- `backend/src/services/eventProcessor.ts`
- `backend/src/routes/webhooks.ts`
- `backend/src/utils/sliderInterpolation.ts`
- `backend/src/index.ts`
- `backend/supabase/seed.sql`

### Frontend
- `frontend/src/types/index.ts`
- `frontend/src/app/chat/page.tsx`
- `frontend/src/components/CompanionChat/ChatInterface.tsx`
- `frontend/src/components/CompanionChat/InputPanel.tsx`
- `frontend/src/components/BackgroundAgent/EventFeed.tsx`
- `frontend/src/components/ProfileSettings/StackSelector.tsx`
- `frontend/src/components/ProfileSettings/ProfileOnboarding.tsx`

### Documentation
- `README.md`
- `BACKGROUND_EVENT_LOOP.md`
- `REFACTOR_SUMMARY.md` (this file)

## TODOs for Integration-Specific Work

### High Priority
1. **GitHub Integration**
   - Implement actual GitHub API calls in `codeRepoAdapter.ts`
   - Set up GitHub webhook endpoint properly
   - Test webhook signature verification

2. **Issue Tracker Integration**
   - Create `issueTrackerAdapter.ts` for Jira/Linear/GitHub Issues
   - Implement issue fetching and creation
   - Add stale issue detection

3. **CI/CD Integration**
   - Enhance build status checking
   - Add support for multiple CI/CD providers (CircleCI, GitLab CI, etc.)
   - Implement build log analysis

### Medium Priority
4. **Documentation Integration**
   - Create `docSpaceAdapter.ts` for Notion/Confluence
   - Implement documentation sync and updates
   - Add outdated doc detection

5. **Metrics Integration**
   - Create `analyticsAdapter.ts` for PostHog/GA/custom metrics
   - Implement regression detection
   - Add anomaly detection

6. **Infrastructure Integration**
   - Create `infraAdapter.ts` for AWS/GCP/Vercel
   - Implement monitoring and alerting
   - Add incident detection

### Low Priority
7. **Content Generation Enhancements**
   - Enhance `contentAdapter.ts` with more templates
   - Add support for more artifact types
   - Improve formatting options

8. **Event Processing Enhancements**
   - Add event batching
   - Implement parallel processing
   - Add caching strategies

## Testing Checklist

- [ ] Test user profile creation with new roles/verticals
- [ ] Test prompt atom selection with new atoms
- [ ] Test code repository webhook reception
- [ ] Test background event loop polling
- [ ] Test event-to-task-description mapping
- [ ] Test frontend components with new copy
- [ ] Test stack selector with new options
- [ ] Test onboarding flow with new roles

## Migration Notes

### Database Migration
When deploying, run migrations in order:
1. `001_create_user_profiles.sql` (updated)
2. `002_create_prompt_atoms.sql` (updated)
3. `003_create_vibe_configs.sql` (updated)
4. `004_create_agent_runs.sql` (unchanged)
5. `005_create_background_events.sql` (updated)

Then run `seed.sql` to populate new prompt atoms.

### Environment Variables
Update `.env` with new variables:
```env
CODE_REPO_API_KEY=your_github_token
CODE_REPO_WEBHOOK_SECRET=your_webhook_secret
CODE_REPO_URL=your-org/your-repo
CODE_REPO_PROVIDER=github
```

### Webhook Endpoints
Update webhook configurations:
- Old: `POST /webhooks/shopify`
- New: `POST /webhooks/code-repo`

## Summary

The refactoring successfully transforms the platform from an e-commerce focused tool to a comprehensive venture lifecycle companion. All core concepts have been generalized, new adapters created, and the entire codebase updated to reflect the new positioning. The platform is now ready for integration with code repositories, issue trackers, CI/CD systems, and other development tools.
