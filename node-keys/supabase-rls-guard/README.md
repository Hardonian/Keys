# Supabase RLS Guard Key

## What This KEY Unlocks

Unlocks Row-Level Security (RLS) policies for tenant isolation in Supabase databases.

This KEY provides:
- RLS policy creation for tenant isolation
- Database function generation for tenant checks
- Migration-ready SQL scripts
- Tenant-scoped data access

## Installation

### Step 1: Copy KEY to Your Project

```bash
cp -r node-keys/supabase-rls-guard ./node-keys/
```

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Usage

### As a Migration

```typescript
// migrations/001_add_rls_policies.ts
import { createRLSPolicies } from '@/node-keys/supabase-rls-guard/src';

export async function up() {
  await createRLSPolicies({
    databaseUrl: process.env.DATABASE_URL!,
    tables: ['subscriptions', 'users'],
  });
}
```

### Direct Usage

```typescript
import { createRLSPolicies } from '@/node-keys/supabase-rls-guard/src';

await createRLSPolicies();
```

## Configuration

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for migrations)

### Tables

By default, RLS policies are created for:
- `subscriptions`
- `users`

You can specify custom tables:

```typescript
await createRLSPolicies({
  tables: ['custom_table1', 'custom_table2'],
});
```

## Assumptions

This KEY assumes:
- Tables have a `tenant_id` column (UUID type)
- RLS is enabled on tables
- `app.tenant_id` setting is set per request (via middleware)

## Setting Tenant ID Per Request

In your Next.js middleware or API routes:

```typescript
// middleware.ts or API route
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  global: {
    headers: {
      'x-tenant-id': tenantId,
    },
  },
});

// Set tenant_id for RLS
await supabase.rpc('set_tenant_id', { tenant_id: tenantId });
```

## Removal

### Step 1: Remove RLS Policies

Run SQL to drop policies:

```sql
DROP POLICY IF EXISTS subscriptions_tenant_isolation ON subscriptions;
DROP POLICY IF EXISTS users_tenant_isolation ON users;
```

### Step 2: Remove KEY Directory

```bash
rm -rf ./node-keys/supabase-rls-guard
```

## Troubleshooting

### Error: "DATABASE_URL is required"

**Solution**: Add `DATABASE_URL` to your `.env.local` file.

### Error: "Policy already exists"

**Solution**: This is expected if policies already exist. The KEY will skip existing policies.

### RLS Not Working

**Solution**: 
1. Ensure RLS is enabled on tables: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Ensure `app.tenant_id` is set per request
3. Verify `tenant_id` column exists on tables

## License

MIT
