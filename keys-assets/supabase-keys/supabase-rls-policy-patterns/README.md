# Supabase Keys: RLS Policy Patterns

**Version**: 1.0.0  
**Tool**: Supabase  
**Maturity**: Operator  
**Outcome**: Compliance

---

## What This Key Unlocks

Common Row-Level Security (RLS) policy patterns for Supabase. This key unlocks:

- **User-Based RLS**: Users can only access their own records
- **Multi-Tenant RLS**: Tenant isolation with organization-based access control
- **Public Read, Authenticated Write**: Public read access with authenticated write
- **Role-Based RLS**: Access control based on user roles (owner, admin, member, viewer)
- **Audit Logging RLS**: Secure audit logs with RLS protection

---

## Installation

1. **Copy migration files** to your Supabase migrations directory:
   ```bash
   cp migrations/*.sql /path/to/supabase/migrations/
   ```

2. **Run migrations** in Supabase SQL Editor or via CLI:
   ```bash
   supabase db reset  # For development
   # Or apply specific migrations
   ```

3. **Customize patterns** for your specific tables and requirements

---

## Included Patterns

### Pattern 1: User-Based RLS

Users can only see and modify their own records.

**Use Case**: User profiles, personal settings, user-owned data

**Files**: `001_user_based_rls.sql`

### Pattern 2: Multi-Tenant RLS

Users can only access records belonging to their tenant (organization).

**Use Case**: SaaS applications, multi-tenant systems

**Files**: `002_multi_tenant_rls.sql`

**Requirements**: 
- `organization_members` table with `org_id` and `user_id` columns
- Helper function `user_belongs_to_tenant()`

### Pattern 3: Public Read, Authenticated Write

Anyone can read published content, but only authenticated users can write.

**Use Case**: Blog posts, public content, community features

**Files**: `003_public_read_authenticated_write.sql`

### Pattern 4: Role-Based RLS

Access control based on user roles (owner, admin, member, viewer).

**Use Case**: Team collaboration, project management, shared resources

**Files**: `004_role_based_rls.sql`

**Requirements**:
- `project_members` table with `role` column
- Helper function `get_user_project_role()`

### Pattern 5: Audit Logging RLS

Secure audit logs with RLS to prevent tampering.

**Use Case**: Compliance, security auditing, change tracking

**Files**: `005_audit_logging_rls.sql`

**Requirements**:
- Trigger function `audit_trigger_function()`
- Apply triggers to tables you want to audit

---

## Usage

### Applying a Pattern

1. **Choose the pattern** that matches your use case
2. **Copy the migration file** to your Supabase project
3. **Customize table names** and column names to match your schema
4. **Run the migration**:
   ```sql
   -- In Supabase SQL Editor
   \i migrations/001_user_based_rls.sql
   ```

### Customizing Patterns

All patterns are templates and should be customized:

- **Table names**: Replace example table names with your actual tables
- **Column names**: Adjust column names to match your schema
- **Helper functions**: Modify helper functions for your specific logic
- **Policy conditions**: Adjust `USING` and `WITH CHECK` clauses as needed

---

## Security Best Practices

1. **Always enable RLS** on tables containing sensitive data
2. **Use SECURITY DEFINER** for helper functions that need elevated privileges
3. **Test policies thoroughly** before deploying to production
4. **Use least privilege principle**: Grant minimum access required
5. **Audit your policies**: Regularly review RLS policies for correctness

---

## Common Issues

### Policies Not Working

- Ensure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check user authentication: `auth.uid()` returns NULL for anonymous users
- Verify policy conditions: Test `USING` clauses manually

### Performance Issues

- Add indexes on columns used in policy conditions
- Avoid complex functions in policies (use helper functions with SECURITY DEFINER)
- Consider materialized views for complex joins

---

## Removal

To remove RLS policies:

1. **Drop policies**:
   ```sql
   DROP POLICY "policy_name" ON table_name;
   ```

2. **Disable RLS** (if removing all policies):
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

3. **Remove helper functions**:
   ```sql
   DROP FUNCTION function_name;
   ```

---

## Requirements

- Supabase project
- PostgreSQL database
- Authentication enabled (`auth.users` table)

---

## License

MIT
