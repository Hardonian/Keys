# SUPABASE BACKEND GAPS REPORT

## Executive Summary

This document provides a systematic approach to validate that your Supabase backend matches the intended state defined in the repository migrations. It includes:

1. **Intended State Inventory** - What should exist based on migrations
2. **Reality Snapshot Instructions** - How to capture actual database state
3. **Gap Analysis Framework** - How to compare intended vs actual
4. **Evidence-Based Findings** - What to look for and document

---

## STEP 1: INTENDED STATE INVENTORY

Based on migrations `000` through `015`, the intended backend state includes:

### Extensions (Required)
- `uuid-ossp` - UUID generation
- `vector` - Vector embeddings for behavior_embedding column

### Core Tables (19 tables)

#### User & Profile Tables
1. **user_profiles**
   - Columns: id, user_id (TEXT, UNIQUE), created_at, updated_at, name, role, vertical, stack (JSONB), tone, risk_tolerance, kpi_focus, perspective, behavior_embedding (VECTOR(1536)), brand_voice, company_context, preferred_models (JSONB), timezone, premium_features (JSONB), stripe_customer_id, subscription_status, subscription_tier, subscription_current_period_end, org_id (FK to auth.users), prevented_failures_count, guarantee_coverage (TEXT[]), integration_access (TEXT[])
   - Constraints: subscription_status CHECK, subscription_tier CHECK (includes 'pro+')
   - Indexes: user_id, role, vertical, updated_at DESC, stack GIN, premium partial, subscription_status, org_id, prevented_failures
   - RLS: Enabled with policies for SELECT/INSERT/UPDATE/DELETE

2. **prompt_atoms**
   - Columns: id, created_at, name (NOT NULL), category (NOT NULL), version, system_prompt, constraints (JSONB), examples (JSONB), weight, compatible_atoms (TEXT[]), target_roles (TEXT[]), target_verticals (TEXT[]), usage_count, success_rate, active
   - Constraints: UNIQUE(name, version)
   - Indexes: category, active, name, name+version UNIQUE, target_roles GIN, target_verticals GIN, compatible_atoms GIN
   - RLS: Not enabled (public-readable admin data)

3. **vibe_configs**
   - Columns: id, user_id (TEXT, NOT NULL), created_at, updated_at, name, playfulness (CHECK 0-100), revenue_focus (CHECK 0-100), investor_perspective (CHECK 0-100), selected_atoms (UUID[]), custom_instructions, auto_suggest, approval_required, logging_level
   - Constraints: CHECK constraints on playfulness, revenue_focus, investor_perspective
   - Indexes: user_id, created_at DESC, user_id+created_at DESC, selected_atoms GIN
   - RLS: Enabled with policies for SELECT/INSERT/UPDATE/DELETE

4. **agent_runs**
   - Columns: id, user_id (TEXT, NOT NULL), created_at, trigger (NOT NULL), trigger_data (JSONB), assembled_prompt, selected_atoms (UUID[]), vibe_config_snapshot (JSONB), agent_type, model_used, generated_content (JSONB), user_feedback, feedback_detail, tokens_used, latency_ms, cost_usd, failure_pattern_id (FK), success_pattern_id (FK), safety_checks_passed, safety_check_results (JSONB)
   - Indexes: user_id, created_at DESC, trigger, feedback, user_id+created_at DESC, trigger+created_at DESC, user_id+feedback, user_recent partial, failure_pattern, success_pattern, safety_checks
   - RLS: Enabled with policies for SELECT/INSERT/UPDATE/DELETE

5. **background_events**
   - Columns: id, user_id (TEXT, NOT NULL), created_at, event_type (NOT NULL), source (NOT NULL), event_data (JSONB), event_timestamp, suggestion_generated, suggestion_id, user_actioned
   - Indexes: user_id, event_type, source, created_at DESC, actioned, user_id+event_type, suggestion+actioned, timestamp DESC NULLS LAST, user_unprocessed partial
   - RLS: Enabled with policies for SELECT/INSERT/UPDATE/DELETE

#### Template System Tables (7 tables)
6. **user_template_customizations** - user_id (UUID FK), template_id, milestone, custom_variables (JSONB), custom_instructions, enabled, created_at, updated_at, UNIQUE(user_id, template_id)
7. **template_versions** - template_id, version, changelog, created_at, UNIQUE(template_id, version)
8. **template_customization_history** - customization_id (FK), user_id (FK), template_id, custom_variables, custom_instructions, enabled, change_type, change_reason, created_at, changed_by (FK)
9. **template_usage_analytics** - user_id (FK), template_id, usage_count, last_used_at, success_count, failure_count, average_rating, total_ratings, average_tokens_used, average_latency_ms, first_used_at, updated_at, UNIQUE(user_id, template_id)
10. **template_feedback** - user_id (FK), template_id, rating (CHECK 1-5), comment, suggestions, created_at, updated_at, UNIQUE(user_id, template_id)
11. **shared_template_customizations** - owner_id (FK), template_id, name, description, is_public, shared_with_user_ids (UUID[]), shared_with_team_ids (UUID[]), custom_variables (JSONB), custom_instructions, usage_count, rating_average, created_at, updated_at
12. **template_presets** - name, description, category, template_ids (TEXT[]), custom_variables (JSONB), custom_instructions, is_system_preset, created_by (FK), usage_count, created_at, updated_at

#### Billing & Organizations (4 tables)
13. **organizations** - id, name, slug (UNIQUE), owner_id (FK), created_at, updated_at
14. **organization_members** - org_id (FK), user_id (FK), role (CHECK: owner/admin/member), created_at, UNIQUE(org_id, user_id)
15. **invitations** - org_id (FK), email, role (CHECK: admin/member), invited_by (FK), token (UNIQUE), expires_at, accepted_at, created_at, UNIQUE(org_id, email)
16. **usage_metrics** - user_id (TEXT), metric_type (CHECK: runs/tokens/templates/exports), metric_value, period_start, period_end, created_at, UNIQUE(user_id, metric_type, period_start)

#### Failure Memory System (3 tables)
17. **failure_patterns** - user_id (TEXT), created_at, pattern_type (CHECK), pattern_description, pattern_signature, detected_in, original_output, failure_reason, prevention_rule, prevention_prompt_addition, context_snapshot (JSONB), template_id, vibe_config_snapshot (JSONB), severity (CHECK), resolved, resolved_at, occurrence_count, last_occurrence
18. **success_patterns** - user_id (TEXT), created_at, pattern_type (CHECK), pattern_description, pattern_signature, context, outcome, success_factors (TEXT[]), template_id, vibe_config_snapshot (JSONB), context_snapshot (JSONB), output_example, usage_count, success_rate, last_used
19. **pattern_matches** - user_id (TEXT), created_at, pattern_id, pattern_type (CHECK: failure/success), match_type (CHECK: exact/similar/prevented), matched_against, match_confidence, context_snapshot (JSONB), action_taken, outcome

### Functions (4 functions)
1. **update_updated_at_column()** - TRIGGER function, SECURITY DEFINER, search_path = public
2. **update_user_template_customizations_updated_at()** - TRIGGER function, SECURITY DEFINER, search_path = public
3. **track_template_usage(p_user_id UUID, p_template_id TEXT, p_success BOOLEAN, p_tokens_used INT, p_latency_ms INT)** - SECURITY DEFINER, search_path = public
4. **create_customization_history()** - TRIGGER function, SECURITY DEFINER, search_path = public

### Triggers (7 triggers)
1. `update_user_profiles_updated_at` - BEFORE UPDATE on user_profiles
2. `update_vibe_configs_updated_at` - BEFORE UPDATE on vibe_configs
3. `update_user_template_customizations_updated_at` - BEFORE UPDATE on user_template_customizations
4. `track_customization_changes` - AFTER INSERT OR UPDATE on user_template_customizations
5. `update_template_presets_updated_at` - BEFORE UPDATE on template_presets
6. `update_shared_template_customizations_updated_at` - BEFORE UPDATE on shared_template_customizations
7. `update_template_feedback_updated_at` - BEFORE UPDATE on template_feedback

### RLS Policies (Expected: ~50+ policies)
All user-owned tables should have RLS enabled with policies:
- **user_profiles**: 4 policies (SELECT/INSERT/UPDATE/DELETE)
- **vibe_configs**: 4 policies
- **agent_runs**: 4 policies
- **background_events**: 4 policies
- **user_template_customizations**: 4 policies
- **template_customization_history**: 1 policy (SELECT)
- **template_usage_analytics**: 2 policies (SELECT, ALL)
- **template_feedback**: 2 policies (ALL for own, SELECT for public)
- **shared_template_customizations**: 2 policies (SELECT for public/shared, ALL for own)
- **template_presets**: 3 policies (SELECT all, INSERT own, UPDATE own)
- **organizations**: 3 policies (SELECT own/member, INSERT own, UPDATE own)
- **organization_members**: 2 policies (SELECT members, ALL admins)
- **invitations**: 2 policies (SELECT members, ALL admins)
- **usage_metrics**: 2 policies (SELECT own, INSERT system)
- **failure_patterns**: 3 policies (SELECT/INSERT/UPDATE own)
- **success_patterns**: 3 policies (SELECT/INSERT/UPDATE own)
- **pattern_matches**: 2 policies (SELECT/INSERT own)

---

## STEP 2: REALITY SNAPSHOT INSTRUCTIONS

### Option A: Run INTROSPECTION.sql
1. Connect to your Supabase database (SQL Editor or psql)
2. Run `/workspace/backend/supabase/INTROSPECTION.sql`
3. Save all output to a file: `REALITY_SNAPSHOT.txt`

### Option B: Use db-inventory.ts Script
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... tsx scripts/db-inventory.ts
```
This will generate `.db-inventory.json` with structured data.

### Option C: Manual Queries
Run each section from INTROSPECTION.sql individually and document results.

---

## STEP 3: GAP ANALYSIS FRAMEWORK

For each category below, compare INTENDED vs ACTUAL and document gaps:

### Category A: Missing Objects
- [ ] Missing extensions
- [ ] Missing tables
- [ ] Missing columns in existing tables
- [ ] Missing indexes
- [ ] Missing constraints
- [ ] Missing functions
- [ ] Missing triggers

### Category B: Divergent Definitions
- [ ] Column type mismatches (e.g., TEXT vs VARCHAR, INT vs BIGINT)
- [ ] Default value mismatches
- [ ] Constraint definition differences
- [ ] Index definition differences (e.g., missing partial WHERE clause)
- [ ] Function signature differences
- [ ] Function security_definer vs invoker differences
- [ ] Function search_path differences

### Category C: Missing/Incorrect RLS
- [ ] RLS not enabled on tables that should have it
- [ ] Missing RLS policies (expected count vs actual count)
- [ ] Policy definition mismatches (USING/WITH CHECK expressions)
- [ ] Over-permissive policies (e.g., USING (true) when should be user-scoped)

### Category D: Missing/Incorrect Grants
- [ ] Public schema grants that should be revoked
- [ ] Missing grants to anon/authenticated roles
- [ ] Over-permissive grants

### Category E: Realtime Configuration
- [ ] Tables missing from supabase_realtime publication
- [ ] Missing REPLICA IDENTITY FULL for UPDATE/DELETE payloads

### Category F: Storage (if applicable)
- [ ] Missing buckets
- [ ] Incorrect bucket policies
- [ ] Missing storage.objects RLS policies

---

## STEP 4: EVIDENCE-BASED FINDINGS TEMPLATE

For each gap found, document:

```markdown
### Gap ID: GAP-001
**Category**: Missing Objects
**Severity**: Critical / High / Medium / Low
**Table/Object**: user_profiles
**Issue**: Column 'premium_features' is missing
**Evidence Query**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles' 
AND column_name = 'premium_features';
```
**Expected**: Should return 1 row
**Actual**: Returns 0 rows
**Impact**: Premium features cannot be stored
**Fix**: Add column via PATCH.sql (already included)
```

---

## STEP 5: COMMON GAPS TO CHECK

### High-Priority Gaps

1. **Missing RLS on Core Tables**
   - Check: `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('user_profiles', 'vibe_configs', 'agent_runs', 'background_events');`
   - Expected: `relrowsecurity = true` for all

2. **Missing subscription_tier 'pro+' Value**
   - Check: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%subscription_tier%';`
   - Expected: Constraint includes 'pro+' in CHECK values

3. **Missing Failure Memory Tables**
   - Check: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('failure_patterns', 'success_patterns', 'pattern_matches');`
   - Expected: All 3 tables exist

4. **Missing Function search_path Settings**
   - Check: `SELECT proname, prosecdef, proconfig FROM pg_proc WHERE proname IN ('update_updated_at_column', 'track_template_usage');`
   - Expected: `proconfig` includes `search_path = public` for SECURITY DEFINER functions

5. **Missing Foreign Keys for Failure Patterns**
   - Check: `SELECT conname FROM pg_constraint WHERE conname LIKE '%failure_pattern%' OR conname LIKE '%success_pattern%';`
   - Expected: Foreign keys exist in agent_runs table

### Medium-Priority Gaps

6. **Missing Indexes on Frequently Queried Columns**
   - Check: Indexes on user_id, created_at DESC, subscription_status
   - Expected: All exist per intended inventory

7. **Missing GIN Indexes on JSONB/Array Columns**
   - Check: `SELECT indexname FROM pg_indexes WHERE indexdef LIKE '%GIN%';`
   - Expected: GIN indexes on stack, selected_atoms, target_roles, etc.

8. **Missing Partial Indexes**
   - Check: `SELECT indexname, indexdef FROM pg_indexes WHERE indexdef LIKE '%WHERE%';`
   - Expected: Partial indexes for premium users, unprocessed events, recent runs

### Low-Priority Gaps

9. **Missing Comments on Columns**
   - Check: `SELECT obj_description(oid) FROM pg_class WHERE relname = 'user_profiles';`
   - Expected: Comments exist (optional, but good practice)

10. **Realtime Publication Membership**
    - Check: `SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`
    - Expected: Tables added if realtime is required (not in migrations, so optional)

---

## STEP 6: VALIDATION CHECKLIST

After running PATCH.sql, verify:

- [ ] All 19 tables exist
- [ ] All expected columns exist with correct types
- [ ] All indexes exist (check count: should be 50+)
- [ ] All constraints exist (CHECK, UNIQUE, FOREIGN KEY)
- [ ] RLS enabled on all user-owned tables (15+ tables)
- [ ] RLS policies exist (40+ policies)
- [ ] All 4 functions exist with correct signatures
- [ ] All 7 triggers exist
- [ ] Functions have SECURITY DEFINER and search_path set correctly
- [ ] Foreign keys reference correct tables
- [ ] subscription_tier constraint includes 'pro+'
- [ ] Failure memory tables exist and are linked to agent_runs

---

## STEP 7: NEXT STEPS

1. **Run INTROSPECTION.sql** to capture actual state
2. **Compare against intended state** using this report
3. **Document gaps** using the evidence template
4. **Run PATCH.sql** to fix gaps (idempotent, safe to run)
5. **Run VERIFY.sql** to confirm fixes
6. **Re-run INTROSPECTION.sql** to capture new state
7. **Compare again** to ensure all gaps are closed

---

## NOTES

- **No Destructive Operations**: PATCH.sql only adds/fixes, never drops data
- **Idempotent**: Safe to run multiple times
- **Schema Qualification**: All objects explicitly use `public.` prefix
- **RLS Policy Naming**: Policies use descriptive names that match migration intent
- **Function Security**: All SECURITY DEFINER functions set search_path = public

---

**Last Updated**: Based on migrations 000-015
**Next Review**: After applying PATCH.sql and running VERIFY.sql
