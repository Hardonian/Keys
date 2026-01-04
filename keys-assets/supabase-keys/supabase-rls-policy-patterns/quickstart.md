# Quick Start: Supabase RLS Policy Patterns

Get RLS policies set up in 5 minutes.

---

## Step 1: Choose Your Pattern

Select the pattern that matches your use case:

- **User-Based**: Users own their data
- **Multi-Tenant**: Organization-based isolation
- **Public Read**: Public content with authenticated writes
- **Role-Based**: Team collaboration with roles
- **Audit Logging**: Secure change tracking

---

## Step 2: Copy Migration File

Copy the migration file to your Supabase project:

```bash
# Example: User-based RLS
cp migrations/001_user_based_rls.sql /path/to/supabase/migrations/
```

---

## Step 3: Customize

Edit the migration file to match your schema:

```sql
-- Replace table name
CREATE TABLE IF NOT EXISTS your_table (
  -- Replace columns
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  -- ... your columns
);
```

---

## Step 4: Run Migration

In Supabase SQL Editor:

```sql
-- Copy and paste the migration SQL
-- Or use \i command if using psql
\i migrations/001_user_based_rls.sql
```

---

## Step 5: Test

Test your policies:

```sql
-- As authenticated user
SELECT * FROM your_table; -- Should only see own records

-- As different user
SELECT * FROM your_table; -- Should see different records
```

---

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Customize policies for your specific needs
- Add more patterns as needed

---

**That's it!** Your RLS policies are now protecting your data.
