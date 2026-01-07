# Verification Checklist

**Date:** January 7, 2026
**Purpose:** Verify the Supabase backend and application layer audit artifacts.

## 1. Local Verification (Dry Run)

If you have the Supabase CLI installed locally and linked to a test project:

1.  **Check for Drift:**
    ```bash
    cd backend
    supabase db diff
    ```
    *Expectation:* You should see the contents of `20260107000000_remainder_consolidation.sql` (or similar logic) if your DB is behind.

2.  **Apply Migration:**
    ```bash
    cd backend
    supabase db reset # WARNING: This wipes local data!
    # OR
    supabase migration up
    ```

3.  **Run Evidence Queries:**
    Use the `psql` command or Supabase Studio SQL Editor to run the queries listed in `AUDIT_REPORT.md`.

## 2. CI/CD Setup

1.  **Secrets:** Ensure the following secrets are set in your GitHub Repository:
    - `SUPABASE_ACCESS_TOKEN`
    - `SUPABASE_DB_PASSWORD`
    - `SUPABASE_PROJECT_REF`

2.  **Trigger:**
    - Push the changes to `main`.
    - Or manually trigger the "Supabase Migrations" workflow in the Actions tab.

## 3. Critical Checkpoints

- [ ] **`prompt_atoms` RLS:** Verify that `prompt_atoms` has `rls_enabled = true`.
- [ ] **No Policy Duplication:** Check `pg_policies` to ensure you don't have duplicate policies like "Users can view own profile" (e.g., one from `012` and one from `consolidated`). The migration script is designed to prevent this, but verification is key.
- [ ] **Middleware:** Ensure your deployment environment has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set to avoid the "placeholder" fallback behavior.

## 4. Rollback Plan

If the migration causes issues:
1.  **Revert:** Revert the commit that added the migration file.
2.  **Redeploy:** Push the revert to trigger a new deployment (Supabase migrations are forward-only usually, so you might need to manually run a SQL fix or use `supabase db repair` if using the CLI for history management).
3.  **Manual Fix:** Since the migration is idempotent, you can safe-modify it or add a new migration `20260107000001_fix.sql` to correct any specific policy issues.
