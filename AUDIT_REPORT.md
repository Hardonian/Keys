# Supabase & Application Security Audit Report

**Date:** January 7, 2026
**Auditor:** Gemini 3 (AI Cloud Agent)
**Scope:** Supabase Backend (Schema, RLS) + Application Execution Layer (Next.js App Router)

## 1. Executive Summary

A comprehensive audit was performed on the `backend` and `frontend` repositories. The project uses a **Next.js App Router** frontend and a **Supabase** backend with a consolidated schema structure.

**Overall Status:** 🟡 **MODERATE RISK** (Pending Migration Consolidation)

Key findings:
- **Schema Definition:** Robust "Declared Desired State" exists in `backend/supabase/migrations`, but multiple overlapping migration files increase the risk of drift or conflict during fresh deployments.
- **Security (RLS):** RLS is explicitly enabled for most sensitive tables (`user_profiles`, `organizations`, `agent_runs`).
- **Critical Gap:** The `prompt_atoms` table lacks explicit RLS in the source SQL, relying on default public access or subsequent patches.
- **Middleware:** Authentication is correctly enforced on sensitive routes (`/dashboard`, `/chat`, etc.), but the fail-open logic for missing environment variables is a potential configuration risk.
- **Edge Functions:** No edge functions were detected in the standard locations.

## 2. Repo Inventory & Architecture

- **Frontend:** Next.js (App Router)
  - **Auth:** `@supabase/ssr` (modern Cookie-based auth)
  - **Middleware:** `src/middleware.ts` guards `/dashboard`, `/chat`, `/profile`, `/templates`, `/admin`.
  - **Routes:** Structured by feature (`dashboard`, `marketplace`, `onboarding`).

- **Backend:** Node.js/TypeScript (Auxiliary services) + Supabase
  - **Migrations:** `backend/supabase/migrations` contains ~18 files.
  - **Schema:** `consolidated_schema.sql` attempts to unify state, but separate migrations like `012` and `013` define overlapping RLS/Tables.
  - **Multi-tenancy:** Hybrid model using `organizations` (Team) and `user_profiles` (Personal).

## 3. Drift & Risk Analysis

### A. Database Schema & RLS
| Severity | Finding | Recommendation |
| :--- | :--- | :--- |
| 🟠 **MED** | `prompt_atoms` table defined without explicit RLS. | Enable RLS. Add policy `SELECT USING (true)` for public read, restrict write to service_role. |
| 🟠 **MED** | Potential duplicate policies across `consolidated_schema.sql` and `012_...sql`. | Use `DO $$` guards or `IF NOT EXISTS` logic in the remainder migration to prevent errors. |
| 🟡 **LOW** | `billing` and `organizations` migrations exist separately from consolidated schema. | Unify into the single idempotent remainder migration. |

### B. Application Layer
| Severity | Finding | Recommendation |
| :--- | :--- | :--- |
| 🟡 **LOW** | Middleware uses placeholder values if env vars are missing (`placeholder.supabase.co`). | Ensure CI/CD fails build if `NEXT_PUBLIC_SUPABASE_URL` is missing, rather than using placeholders. |
| 🟢 **GOOD** | Strong typing for Supabase Client (`@supabase/supabase-js`). | Continue usage. |

## 4. Evidence Queries (Run these to verify deployed state)

Run these SQL queries in your Supabase SQL Editor to confirm the findings:

### 1. Verify RLS Status (All user tables must have `rls_enabled = true`)
```sql
select n.nspname as schema, c.relname as table,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where c.relkind='r'
  and n.nspname not in ('pg_catalog','information_schema')
order by 1,2;
```

### 2. Audit Public Policies (Ensure no overly permissive `true` policies on sensitive data)
```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where qual::text like '%true%' OR with_check::text like '%true%'
order by 1,2,3;
```

### 3. Check for Duplicate Indexes
```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname not in ('pg_catalog','information_schema')
order by 1,2,3;
```

## 5. Action Plan

1.  **Apply Remainder Migration:** Run the generated `timestamp_remainder_consolidation.sql` to bring the DB to the desired state idempotently.
2.  **Verify RLS:** Run the evidence queries to confirm `prompt_atoms` and other tables are secured.
3.  **Automate:** Merge the `.github/workflows/supabase-migrate.yml` to prevent future drift.
